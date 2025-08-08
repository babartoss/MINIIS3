import { NextRequest } from "next/server";
import { z } from "zod";
import { getFidByAddress } from "~/lib/kv";

const requestSchema = z.object({
  addresses: z.array(z.string()),
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
    const fidsMap: { [address: string]: number | null } = {};
    await Promise.all(
      requestBody.data.addresses.map(async (address) => {
        const fid = await getFidByAddress(address);
        fidsMap[address] = fid;
      })
    );
    return Response.json(fidsMap);
  } catch (error) {
    return Response.json(
      { success: false, error },
      { status: 500 }
    );
  }
}