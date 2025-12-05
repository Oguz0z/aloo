import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { parseRequestBody } from '@/lib/errors';
import type { TaskType, TaskPriority } from '@/types';

// GET - Fetch user's tasks with optional filters
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Status filter: pending, completed, all
    const status = searchParams.get('status') || 'pending';

    // Due date filter: today, overdue, week, all
    const due = searchParams.get('due') || 'all';

    // Lead filter
    const leadId = searchParams.get('leadId');

    // Build where clause
    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    // Status filter
    if (status === 'pending') {
      where.completedAt = null;
    } else if (status === 'completed') {
      where.completedAt = { not: null };
    }

    // Lead filter
    if (leadId) {
      where.leadId = leadId;
    }

    // Due date filter
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
    const endOfWeek = new Date(startOfDay.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

    if (due === 'today') {
      where.dueAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    } else if (due === 'overdue') {
      where.dueAt = {
        lt: startOfDay,
      };
      where.completedAt = null; // Only show overdue if not completed
    } else if (due === 'week') {
      where.dueAt = {
        gte: startOfDay,
        lte: endOfWeek,
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ dueAt: 'asc' }, { priority: 'desc' }],
      include: {
        lead: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Calculate stats
    const allTasks = await prisma.task.findMany({
      where: { userId: session.user.id },
      select: { completedAt: true, dueAt: true },
    });

    const stats = {
      total: allTasks.length,
      pending: allTasks.filter((t) => !t.completedAt).length,
      completed: allTasks.filter((t) => t.completedAt).length,
      overdue: allTasks.filter((t) => !t.completedAt && t.dueAt < startOfDay).length,
      dueToday: allTasks.filter(
        (t) => !t.completedAt && t.dueAt >= startOfDay && t.dueAt <= endOfDay
      ).length,
    };

    // Transform to our type format
    const transformedTasks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type as TaskType,
      dueAt: task.dueAt.toISOString(),
      priority: task.priority as TaskPriority,
      completedAt: task.completedAt?.toISOString(),
      leadId: task.leadId,
      lead: task.lead,
      createdAt: task.createdAt.toISOString(),
    }));

    return NextResponse.json({ tasks: transformedTasks, stats });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST - Create a new task
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await parseRequestBody<{
      title?: string;
      description?: string;
      type?: string;
      dueAt?: string;
      priority?: string;
      leadId?: string;
    }>(request);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { title, description, type, dueAt, priority, leadId } = body;

    if (!title || !dueAt) {
      return NextResponse.json({ error: 'Title and due date are required' }, { status: 400 });
    }

    // Verify lead belongs to user if provided
    if (leadId) {
      const lead = await prisma.lead.findFirst({
        where: {
          id: leadId,
          userId: session.user.id,
        },
      });
      if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
    }

    const task = await prisma.task.create({
      data: {
        userId: session.user.id,
        title,
        description,
        type: type || 'other',
        dueAt: new Date(dueAt),
        priority: priority || 'medium',
        leadId,
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        type: task.type as TaskType,
        dueAt: task.dueAt.toISOString(),
        priority: task.priority as TaskPriority,
        completedAt: task.completedAt?.toISOString(),
        leadId: task.leadId,
        lead: task.lead,
        createdAt: task.createdAt.toISOString(),
      },
      message: 'Task created successfully',
    });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
