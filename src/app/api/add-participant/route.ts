// src/app/api/add-participant/route.ts
import { NextRequest, NextResponse } from "next/server";
import { addParticipantToRound } from "~/lib/kv";
import { z } from "zod";

const requestSchema = z.object({
  round: z.number(),
  number: z.string(),
  address: z.string(),
  fid: z.number().optional(),
  username: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  try {
    await addParticipantToRound(parsed.data.round, {
      number: parsed.data.number,
      address: parsed.data.address,
      fid: parsed.data.fid,
      username: parsed.data.username,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Add participant error:', error);
    return NextResponse.json({ error: 'Failed to add' }, { status: 500 });
  }
}