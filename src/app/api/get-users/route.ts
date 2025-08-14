import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getNeynarClient } from "~/lib/neynar";
import { getUserInfo, setUserInfo } from "~/lib/kv";

const requestSchema = z.object({
  fids: z.array(z.number()),
});

export async function POST(request: NextRequest) {
  const requestJson = await request.json();
  const requestBody = requestSchema.safeParse(requestJson);

  if (requestBody.success === false) {
    return NextResponse.json(
      { success: false, errors: requestBody.error.errors },
      { status: 400 }
    );
  }

  try {
    const client = getNeynarClient();
    const { fids } = requestBody.data;
    if (fids.length === 0) {
      return NextResponse.json({});
    }

    const usersMap: { [fid: number]: { username: string; display_name: string } } = {};

    // Check cache trước, chỉ fetch Neynar cho FIDs chưa có
    const uncachedFids: number[] = [];
    for (const fid of fids) {
      const cachedInfo = await getUserInfo(fid);
      if (cachedInfo) {
        usersMap[fid] = cachedInfo;
      } else {
        uncachedFids.push(fid);
      }
    }

    if (uncachedFids.length > 0) {
      const usersResponse = await client.fetchBulkUsers({ fids: uncachedFids });
      usersResponse.users.forEach(async (user: any) => {
        const info = {
          username: user.username,
          display_name: user.display_name,
        };
        usersMap[user.fid] = info;
        await setUserInfo(user.fid, info); // Cache
      });
    }

    return NextResponse.json(usersMap);
  } catch (error) {
    return NextResponse.json(
      { success: false, error },
      { status: 500 }
    );
  }
}