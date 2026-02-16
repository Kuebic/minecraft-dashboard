import { NextResponse } from 'next/server';
import { getAllPlayerStats } from '@/lib/db/queries';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const players = getAllPlayerStats(search, limit, offset);

    return NextResponse.json({
      success: true,
      data: players,
    });
  } catch (error) {
    console.error('[API /players/history] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get player history',
      },
      { status: 500 }
    );
  }
}
