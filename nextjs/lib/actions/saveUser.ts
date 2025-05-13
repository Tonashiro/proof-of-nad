// lib/actions/saveUserToRedis.ts

import { redis } from "@/lib/redis";
import type { UserProfile } from "@/lib/types";

export async function saveUserProfile(user: UserProfile): Promise<void> {
  const key = `user:${user.fid}`;

  if (!redis) {
    throw new Error("Redis client is not initialized");
  }

  await redis.set(key, user);
}
