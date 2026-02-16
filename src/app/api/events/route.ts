import { NextResponse } from 'next/server';
import { getRecentEvents } from '@/lib/db/queries';
import type { EventType } from '@/types/minecraft';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const typesParam = searchParams.get('types');

    let eventTypes: EventType[] | undefined;
    if (typesParam) {
      eventTypes = typesParam.split(',') as EventType[];
    }

    const events = getRecentEvents(limit, eventTypes, offset);

    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('[API /events] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get events',
      },
      { status: 500 }
    );
  }
}
