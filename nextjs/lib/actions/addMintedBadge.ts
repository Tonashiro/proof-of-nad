import { redis } from "@/lib/redis";
import { UserProfile } from "@/lib/types";

export async function addMintedBadge(fid: string, badgeId: number) {
  if (!redis) {
    throw new Error("Redis client is not initialized");
  }

  if (!fid) {
    throw new Error("FID is required");
  }

  const key = `user:${fid}`;
  const raw = await redis.get(key);
  if (!raw) return;

  const user: UserProfile = JSON.parse(raw as string);

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.badges.includes(badgeId)) {
    user.badges.push(badgeId);

    await redis.set(key, JSON.stringify(user));
  }
}
