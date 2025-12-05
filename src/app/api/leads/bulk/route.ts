import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PATCH - Bulk update leads (status change or add tag)
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { leadIds, action, status, tagId } = body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'Lead IDs are required' }, { status: 400 });
    }

    // Verify all leads belong to user
    const leads = await prisma.lead.findMany({
      where: {
        id: { in: leadIds },
        userId: session.user.id,
      },
    });

    if (leads.length !== leadIds.length) {
      return NextResponse.json({ error: 'Some leads not found' }, { status: 404 });
    }

    if (action === 'status') {
      if (!status) {
        return NextResponse.json({ error: 'Status is required' }, { status: 400 });
      }

      // Update all leads
      await prisma.lead.updateMany({
        where: {
          id: { in: leadIds },
          userId: session.user.id,
        },
        data: {
          status,
          ...((['contacted', 'called'].includes(status)) && { lastContactedAt: new Date() }),
        },
      });

      return NextResponse.json({
        message: `Updated ${leads.length} leads to "${status}"`,
        updatedCount: leads.length,
      });
    }

    if (action === 'add_tag') {
      if (!tagId) {
        return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
      }

      // Verify tag belongs to user
      const tag = await prisma.tag.findFirst({
        where: {
          id: tagId,
          userId: session.user.id,
        },
      });

      if (!tag) {
        return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
      }

      // Add tag to all leads (skip if already exists)
      let addedCount = 0;
      for (const lead of leads) {
        const existing = await prisma.leadTag.findUnique({
          where: {
            leadId_tagId: {
              leadId: lead.id,
              tagId,
            },
          },
        });

        if (!existing) {
          await prisma.leadTag.create({
            data: {
              leadId: lead.id,
              tagId,
            },
          });

          addedCount++;
        }
      }

      return NextResponse.json({
        message: `Added tag "${tag.name}" to ${addedCount} leads`,
        addedCount,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Bulk update error:', error);
    return NextResponse.json({ error: 'Failed to update leads' }, { status: 500 });
  }
}

// DELETE - Bulk delete leads
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { leadIds } = body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'Lead IDs are required' }, { status: 400 });
    }

    // Delete all leads (Prisma will cascade delete related records)
    const result = await prisma.lead.deleteMany({
      where: {
        id: { in: leadIds },
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      message: `Deleted ${result.count} leads`,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json({ error: 'Failed to delete leads' }, { status: 500 });
  }
}
