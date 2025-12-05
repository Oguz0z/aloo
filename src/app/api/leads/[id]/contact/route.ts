import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get contact logs for a lead
export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Verify ownership
    const lead = await prisma.lead.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const contactLogs = await prisma.contactLog.findMany({
      where: { leadId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ contactLogs });
  } catch (error) {
    console.error('Get contact logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch contact logs' }, { status: 500 });
  }
}

// POST - Add contact log entry
export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { type, summary, outcome } = body;

    if (!type || !summary) {
      return NextResponse.json(
        { error: 'Type and summary are required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const lead = await prisma.lead.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Create contact log
    const contactLog = await prisma.contactLog.create({
      data: {
        leadId: id,
        type,
        summary,
        outcome,
      },
    });

    // Update lead's lastContactedAt
    await prisma.lead.update({
      where: { id },
      data: { lastContactedAt: new Date() },
    });

    return NextResponse.json({
      contactLog,
      message: 'Contact log added successfully',
    });
  } catch (error) {
    console.error('Add contact log error:', error);
    return NextResponse.json({ error: 'Failed to add contact log' }, { status: 500 });
  }
}
