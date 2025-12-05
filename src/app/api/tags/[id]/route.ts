import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH - Update a tag
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, color } = body;

    // Find the tag and verify ownership
    const tag = await prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    if (tag.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Build update data
    const updateData: { name?: string; color?: string } = {};

    if (name !== undefined) {
      const trimmedName = name.trim();
      // Check if another tag has this name
      const existing = await prisma.tag.findFirst({
        where: {
          userId: session.user.id,
          name: trimmedName,
          id: { not: id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'A tag with this name already exists' },
          { status: 409 }
        );
      }

      updateData.name = trimmedName;
    }

    if (color !== undefined) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
        return NextResponse.json(
          { error: 'Invalid color format. Use hex format (e.g., #3b82f6)' },
          { status: 400 }
        );
      }
      updateData.color = color;
    }

    const updatedTag = await prisma.tag.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { leads: true },
        },
      },
    });

    return NextResponse.json({
      tag: {
        id: updatedTag.id,
        name: updatedTag.name,
        color: updatedTag.color,
        leadCount: updatedTag._count.leads,
        createdAt: updatedTag.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Update tag error:', error);
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
  }
}

// DELETE - Delete a tag
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Find the tag and verify ownership
    const tag = await prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    if (tag.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.tag.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Delete tag error:', error);
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
}
