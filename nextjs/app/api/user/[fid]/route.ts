import { NextRequest, NextResponse } from "next/server";
import { getUserProfile } from "@/lib/actions/getUser";

export async function GET(
  _req: NextRequest,
  { params }: { params: { fid: string } }
) {
  const { fid } = params;

  if (!fid) {
    return NextResponse.json({ error: "FID is required" }, { status: 400 });
  }

  const user = await getUserProfile(fid);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}
