import { NextRequest, NextResponse } from 'next/server';
import { getUserInfo, getUserPosts, transformUserPostsToTableData } from '@/lib/rapidapi';
import { requireUserId } from '@/lib/auth-utils';
import { isApiError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: 'Query parameter "username" is required' }, { status: 400 });
  }

  try {
    const userId = await requireUserId();

    // First, get user info to get secUid
    const userInfo = await getUserInfo(userId, username);

    if (!userInfo) {
      return NextResponse.json({ error: `User @${username} not found` }, { status: 404 });
    }

    // Then, fetch user's posts using secUid
    const posts = await getUserPosts({
      userId,
      secUid: userInfo.secUid,
    });

    const tableData = transformUserPostsToTableData(posts);

    return NextResponse.json({
      user: userInfo,
      results: tableData,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (isApiError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('TikTok user lookup error:', error);
    return NextResponse.json({ error: 'Failed to fetch TikTok user' }, { status: 500 });
  }
}
