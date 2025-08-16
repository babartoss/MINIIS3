// src/app/api/update-participant/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getNeynarClient } from "~/lib/neynar";
import { getUserInfo, setUserInfo, setParticipant } from "~/lib/kv";

const requestSchema = z.object({
  round: z.number(),
  number: z.number(),
  address: z.string(),
  fid: z.number().optional(),
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
    const { round, number, address, fid } = requestBody.data;
    let username = '';
    let display_name = '';

    if (fid) {
      let userInfo = await getUserInfo(fid);
      if (!userInfo) {
        const client = getNeynarClient();
        const usersResponse = await client.fetchBulkUsers({ fids: [fid] });
        if (usersResponse.users.length > 0) {
          const user = usersResponse.users[0];
          userInfo = {
            username: user.username,
            display_name: user.display_name,
          };
          await setUserInfo(fid, userInfo);
        }
      }
      if (userInfo) {
        username = userInfo.username;
        display_name = userInfo.display_name;
      }
    }

    await setParticipant(round, number, { address, fid, username, display_name });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating participant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update participant' },
      { status: 500 }
    );
  }
}