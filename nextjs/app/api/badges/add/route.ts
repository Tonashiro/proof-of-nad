// app/api/badges/addMinted.ts
import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { UserProfile } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { fid, badgeId } = await req.json();

  if (!fid || badgeId === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!redis) {
    throw new Error("Redis client is not initialized");
  }

  const key = `user:${fid}`;
  const user = await redis.get<UserProfile>(key);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.badges.includes(badgeId)) {
    const updated = { ...user, badges: [...user.badges, badgeId] };
    await redis.set(key, updated);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, message: "Already added" });
}
