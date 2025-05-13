import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

export async function POST(req: NextRequest) {
  const { address, badgeId, tokenURI } = await req.json();

  const messageHash = ethers.solidityPackedKeccak256(
    ["address", "uint256", "string"],
    [address, badgeId, tokenURI]
  );

  const messageBytes = ethers.getBytes(messageHash);

  const signature = await signer.signMessage(messageBytes);

  return NextResponse.json({ signature });
}
