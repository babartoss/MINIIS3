import { NextRequest } from "next/server";
import { z } from "zod";
import { setAddressFid } from "~/lib/kv";

const requestSchema = z.object({
  address: z.string(),
  fid: z.number(),
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
    await setAddressFid(requestBody.data.address, requestBody.data.fid);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { success: false, error },
      { status: 500 }
    );
  }
}