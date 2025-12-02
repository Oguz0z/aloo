import { NextRequest, NextResponse } from 'next/server';
import { getUserPosts, transformUserPostsToTableData } from '@/lib/rapidapi';
import { requireUserId } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const secUid = searchParams.get('secUid');

  if (!secUid) {
    return NextResponse.json({ error: 'Query parameter "secUid" is required' }, { status: 400 });
  }

  try {
    const userId = await requireUserId();

    const posts = await getUserPosts({
      userId,
      secUid,
    });

    const tableData = transformUserPostsToTableData(posts);

    return NextResponse.json({ results: tableData });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('RapidAPI key not configured')) {
      return NextResponse.json({ error: 'RapidAPI key not configured' }, { status: 400 });
    }
    console.error('TikTok user posts error:', error);
    return NextResponse.json({ error: 'Failed to fetch TikTok user posts' }, { status: 500 });
  }
}
