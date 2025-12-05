import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Fetch user's tags
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tags = await prisma.tag.findMany({
      where: { userId: session.user.id },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { leads: true },
        },
      },
    });

    const transformedTags = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      leadCount: tag._count.leads,
      createdAt: tag.createdAt.toISOString(),
    }));

    return NextResponse.json({ tags: transformedTags });
  } catch (error) {
    console.error('Get tags error:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

// POST - Create a new tag
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, color } = body;

    if (!name || !color) {
      return NextResponse.json(
        { error: 'Name and color are required' },
        { status: 400 }
      );
    }

    // Validate color format (hex)
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return NextResponse.json(
        { error: 'Invalid color format. Use hex format (e.g., #3b82f6)' },
        { status: 400 }
      );
    }

    // Check if tag with same name exists
    const existing = await prisma.tag.findUnique({
      where: {
        userId_name: {
          userId: session.user.id,
          name: name.trim(),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A tag with this name already exists' },
        { status: 409 }
      );
    }

    const tag = await prisma.tag.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        color,
      },
    });

    return NextResponse.json({
      tag: {
        id: tag.id,
        name: tag.name,
        color: tag.color,
        leadCount: 0,
        createdAt: tag.createdAt.toISOString(),
      },
      message: 'Tag created successfully',
    });
  } catch (error) {
    console.error('Create tag error:', error);
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}
