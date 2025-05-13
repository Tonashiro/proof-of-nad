import { NextRequest, NextResponse } from "next/server";
import { badges, Badge } from "@/lib/badges";
import { NeynarUser } from "@/lib/neynar";

const ALCHEMY_BASE = "https://monad-testnet.g.alchemy.com";
const ALCHEMY_KEY = process.env.ALCHEMY_KEY!;
const FARCASTER_API = "https://api.neynar.com/v2/farcaster";
const NEYNAR_KEY = process.env.NEYNAR_API_KEY!;

async function alchemyRpc(body: any): Promise<any> {
  const res = await fetch(`${ALCHEMY_BASE}/v2/${ALCHEMY_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function isHolderOfContract(wallet: string): Promise<boolean> {
  const res = await fetch(
    `${ALCHEMY_BASE}/nft/v3/${ALCHEMY_KEY}/isHolderOfContract?wallet=${wallet}&contractAddress=0x922da3512e2bebbe32bcce59adf7e6759fb8cea2`
  );
  const data = await res.json();
  return data.isHolderOfContract === true;
}

async function getFirstTxTimestamp(wallet: string): Promise<string | null> {
  const res = await alchemyRpc({
    id: 1,
    jsonrpc: "2.0",
    method: "alchemy_getAssetTransfers",
    params: [
      {
        fromBlock: "0x0",
        fromAddress: wallet,
        withMetadata: true,
        order: "asc",
        maxCount: "0x1",
        category: ["external"],
      },
    ],
  });
  return res?.result?.transfers?.[0]?.metadata?.blockTimestamp ?? null;
}

async function getUserCasts(fid: string): Promise<any[]> {
  const res = await fetch(`${FARCASTER_API}/feed/user/casts?fid=${fid}`, {
    headers: { "x-api-key": NEYNAR_KEY },
  });

  const data = await res.json();
  return data?.casts ?? [];
}

async function validateTransactionBadges(wallet: string, awarded: Badge[]) {
  const timestamp = await getFirstTxTimestamp(wallet);
  if (!timestamp) return;

  const txDate = new Date(timestamp);
  const txTime = txDate.getTime();

  const DAY1 = new Date("2025-02-26T00:00:00.000Z").getTime();
  const DAY7 = new Date("2025-03-04T23:59:59.999Z").getTime();

  if (txDate.toISOString().startsWith("2025-02-26"))
    awarded.push(badges.find((b) => b.id === 1)!);
  if (txTime >= DAY1 && txTime <= DAY7)
    awarded.push(badges.find((b) => b.id === 2)!);
}

async function validateHolderBadge(wallet: string, awarded: Badge[]) {
  const isHolder = await isHolderOfContract(wallet);
  if (isHolder) awarded.push(badges.find((b) => b.id === 3)!);
}

async function validateUserProfileBadges(user: any, awarded: Badge[]) {
  if (!user) return;

  if (user.power_badge === true) {
    awarded.push(badges.find((b) => b.id === 4)!);
  }
  if (user.verified_addresses?.eth_addresses?.length > 0) {
    awarded.push(badges.find((b) => b.id === 5)!);
  }
  if (user.verified_accounts?.length > 0) {
    awarded.push(badges.find((b) => b.id === 6)!);
  }
  if (user.follower_count >= 50) {
    awarded.push(badges.find((b) => b.id === 7)!);
  }
  if (user.following_count >= 20) {
    awarded.push(badges.find((b) => b.id === 8)!);
  }
  const bioText = user.profile?.bio?.text?.toLowerCase() || "";
  if (bioText.includes("/monad")) {
    awarded.push(badges.find((b) => b.id === 9)!);
  }
}

async function validateCastBadges(fid: string, awarded: Badge[]) {
  const casts = await getUserCasts(fid);
  if (!casts.length) return;

  let monadMentions = 0;
  let uniqueDays = new Set<string>();
  let totalLikes = 0;
  let totalRecasts = 0;

  for (const cast of casts) {
    if (cast.text?.toLowerCase().includes("/monad")) monadMentions++;
    if (cast.timestamp) {
      uniqueDays.add(new Date(cast.timestamp).toDateString());
    }
    totalLikes += cast.reactions?.likes_count || 0;
    totalRecasts += cast.reactions?.recasts_count || 0;
  }

  if (monadMentions > 0) awarded.push(badges.find((b) => b.id === 10)!);
  if (uniqueDays.size >= 7) awarded.push(badges.find((b) => b.id === 11)!);
  if (totalLikes >= 10) awarded.push(badges.find((b) => b.id === 12)!);
  if (totalLikes >= 100) awarded.push(badges.find((b) => b.id === 13)!);
  if (totalRecasts >= 10) awarded.push(badges.find((b) => b.id === 14)!);
  if (totalLikes >= 10 && totalRecasts >= 10)
    awarded.push(badges.find((b) => b.id === 15)!);
}

export async function POST(req: NextRequest) {
  const { wallet, user, fid } = await req.json();
  if (!wallet || !fid) {
    return NextResponse.json(
      { error: "Missing wallet or fid" },
      { status: 400 }
    );
  }

  const awarded: Badge[] = [];
  await validateTransactionBadges(wallet, awarded);
  await validateHolderBadge(wallet, awarded);
  await validateUserProfileBadges(user, awarded);
  await validateCastBadges(fid, awarded);

  return NextResponse.json(awarded);
}
