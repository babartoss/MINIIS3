import { NextRequest } from "next/server";
import { z } from "zod";
import { setAddressFid } from "~/lib/kv";

const schema = z.object({
  fid: z.number(),
  address: z.string(),
});

export async function POST(request: NextRequest) {
  const json = await request.json();
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    return Response.json({ success: false, errors: parsed.error.errors }, { status: 400 });
  }

  await setAddressFid(parsed.data.address, parsed.data.fid);
  return Response.json({ success: true });
}