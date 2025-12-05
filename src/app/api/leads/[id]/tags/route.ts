import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Add tag to lead
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: leadId } = await params;
    const body = await request.json();
    const { tagId } = body;

    if (!tagId) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }

    // Verify lead ownership
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead || lead.userId !== session.user.id) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Verify tag ownership
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!tag || tag.userId !== session.user.id) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Check if already connected
    const existingLink = await prisma.leadTag.findUnique({
      where: {
        leadId_tagId: {
          leadId,
          tagId,
        },
      },
    });

    if (!existingLink) {
      // Create the link
      await prisma.leadTag.create({
        data: {
          leadId,
          tagId,
        },
      });
    }

    // Get updated tags
    const leadTags = await prisma.leadTag.findMany({
      where: { leadId },
      include: { tag: true },
    });

    return NextResponse.json({
      tags: leadTags.map((lt) => ({
        id: lt.tag.id,
        name: lt.tag.name,
        color: lt.tag.color,
        createdAt: lt.tag.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Add tag to lead error:', error);
    return NextResponse.json({ error: 'Failed to add tag' }, { status: 500 });
  }
}

// DELETE - Remove tag from lead
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: leadId } = await params;
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('tagId');

    if (!tagId) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }

    // Verify lead ownership
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead || lead.userId !== session.user.id) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Remove the link
    await prisma.leadTag.deleteMany({
      where: {
        leadId,
        tagId,
      },
    });

    // Get updated tags
    const leadTags = await prisma.leadTag.findMany({
      where: { leadId },
      include: { tag: true },
    });

    return NextResponse.json({
      tags: leadTags.map((lt) => ({
        id: lt.tag.id,
        name: lt.tag.name,
        color: lt.tag.color,
        createdAt: lt.tag.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Remove tag from lead error:', error);
    return NextResponse.json({ error: 'Failed to remove tag' }, { status: 500 });
  }
}
