import { NextRequest } from "next/server";
import { z } from "zod";
import { getNeynarClient } from "~/lib/neynar";

const requestSchema = z.object({
  fids: z.array(z.number()),
});

export async function POST(request: NextRequest) {
  const requestJson = await request.json();
  const requestBody = requestSchema.safeParse(requestJson);

  if (requestBody.success === false) {
    return Response.json(
      { success: false, errors: requestBody.error.errors },
      { status: 400 }
    );
  }

  try {
    const client = getNeynarClient();
    const { fids } = requestBody.data;
    if (fids.length === 0) {
      return Response.json({});
    }
    const usersResponse = await client.fetchBulkUsers({ fids });
    const usersMap: { [fid: number]: { username: string; display_name: string } } = {};
    usersResponse.users.forEach((user: any) => {
      usersMap[user.fid] = {
        username: user.username,
        display_name: user.display_name,
      };
    });
    return Response.json(usersMap);
  } catch (error) {
    return Response.json(
      { success: false, error },
      { status: 500 }
    );
  }
}