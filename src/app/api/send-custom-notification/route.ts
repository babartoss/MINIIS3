import { NextRequest } from "next/server";
import { z } from "zod";
import { sendMiniAppNotification } from "~/lib/notifs";
import { sendNeynarMiniAppNotification } from "~/lib/neynar";

const requestSchema = z.object({
  fid: z.number(),
  title: z.string(),
  body: z.string(),
});

export async function POST(request: NextRequest) {
  const neynarEnabled = process.env.NEYNAR_API_KEY && process.env.NEYNAR_CLIENT_ID;

  const requestJson = await request.json();
  const requestBody = requestSchema.safeParse(requestJson);

  if (requestBody.success === false) {
    return Response.json(
      { success: false, errors: requestBody.error.errors },
      { status: 400 }
    );
  }

  let sendResult;

  if (neynarEnabled) {
    sendResult = await sendNeynarMiniAppNotification({
      fids: [requestBody.data.fid],
      title: requestBody.data.title,
      body: requestBody.data.body,
    });
  } else {
    sendResult = await sendMiniAppNotification({
      fid: requestBody.data.fid,
      title: requestBody.data.title,
      body: requestBody.data.body,
    });
  }

  if (sendResult.state === "error") {
    return Response.json(
      { success: false, error: sendResult.error },
      { status: 500 }
    );
  } else if (sendResult.state === "rate_limit") {
    return Response.json(
      { success: false, error: "Rate limited" },
      { status: 429 }
    );
  } else if (sendResult.state === "no_token") {
    return Response.json(
      { success: false, error: "No notification token" },
      { status: 400 }
    );
  }

  return Response.json({ success: true });
}