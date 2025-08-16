// src/app/api/get-participants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getParticipants } from "~/lib/kv";

export async function GET(request: NextRequest) {
  const roundParam = request.nextUrl.searchParams.get('round');
  if (!roundParam) {
    return NextResponse.json(
      { success: false, error: 'Round parameter is required' },
      { status: 400 }
    );
  }

  const round = parseInt(roundParam, 10);
  if (isNaN(round)) {
    return NextResponse.json(
      { success: false, error: 'Invalid round number' },
      { status: 400 }
    );
  }

  try {
    const participants = await getParticipants(round);
    // Convert to sorted array
    const sortedParticipants = Object.entries(participants)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([number, data]) => ({ number, ...data }));

    return NextResponse.json(sortedParticipants);
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
}