import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get single lead with contact logs
export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        contactLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error('Get lead error:', error);
    return NextResponse.json({ error: 'Failed to fetch lead' }, { status: 500 });
  }
}

// PATCH - Update lead (status, notes, follow-up)
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { status, notes, nextFollowUpAt } = body;

    // Verify ownership
    const existing = await prisma.lead.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (nextFollowUpAt !== undefined) {
      updateData.nextFollowUpAt = nextFollowUpAt ? new Date(nextFollowUpAt) : null;
    }

    // If status changed to contacted/called, update lastContactedAt
    if (status && ['contacted', 'called'].includes(status)) {
      updateData.lastContactedAt = new Date();
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ lead, message: 'Lead updated successfully' });
  } catch (error) {
    console.error('Update lead error:', error);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

// DELETE - Remove lead
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Verify ownership
    const existing = await prisma.lead.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    await prisma.lead.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}
