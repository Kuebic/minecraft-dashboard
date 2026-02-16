import { NextResponse } from 'next/server';
import { getServerConfig, isConfigReadable } from '@/lib/minecraft/config-reader';

export async function GET() {
  try {
    if (!isConfigReadable()) {
      return NextResponse.json(
        {
          success: false,
          error: 'server.properties is not readable. Check file permissions.',
        },
        { status: 403 }
      );
    }

    const config = getServerConfig();

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('[API /config] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to read server configuration',
      },
      { status: 500 }
    );
  }
}
