import { redis } from "@/lib/redis";
import type { UserProfile } from "@/lib/types";

export async function getUserProfile(fid: string): Promise<UserProfile | null> {
  const key = `user:${fid}`;

  if (!fid) {
    throw new Error("FID is required");
  }

  if (!redis) {
    throw new Error("Redis client is not initialized");
  }

  const user = await redis.get<UserProfile>(key);
  return user ?? null;
}
