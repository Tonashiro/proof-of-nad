import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { UserProfile } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as UserProfile;

  if (!body?.fid) {
    return NextResponse.json({ error: "FID is required" }, { status: 400 });
  }

  if (!redis) {
    throw new Error("Redis client is not initialized");
  }

  const redisKey = `user:${body.fid}`;
  const existing = await redis.get(redisKey);

  if (existing) {
    return NextResponse.json(
      { message: "User already exists" },
      { status: 200 }
    );
  }

  await redis.set(redisKey, body);
  return NextResponse.json({ message: "User saved successfully" });
}
