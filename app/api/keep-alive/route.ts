import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({
      status: 'ok',
      message: 'Supabase credentials not configured',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const supabase = createClient(url, key);

    // Query 1 row from branches to register active traffic on Supabase and prevent pausing
    const { data, error } = await supabase
      .from('branches')
      .select('id, name')
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: 'degraded',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      status: 'live',
      message: 'Keep-alive ping successful. Supabase database is active.',
      timestamp: new Date().toISOString(),
      branches_found: data?.length || 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: err.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

