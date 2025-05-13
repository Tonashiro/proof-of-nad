import { NeynarUser } from "@/lib/neynar";

export interface UserProfile extends NeynarUser {
  monad_wallet: string | null;
  verified_wallet: boolean;
  badges: number[];
}