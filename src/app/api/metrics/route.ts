import { NextResponse } from 'next/server';
import { getMetrics } from '@/lib/db/queries';
import type { TimeRange } from '@/types/minecraft';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') || '1h') as TimeRange;

    // Validate time range
    const validRanges: TimeRange[] = ['1h', '6h', '24h', '7d'];
    if (!validRanges.includes(range)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid time range. Use: 1h, 6h, 24h, or 7d',
        },
        { status: 400 }
      );
    }

    const metrics = getMetrics(range);

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('[API /metrics] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get metrics',
      },
      { status: 500 }
    );
  }
}
