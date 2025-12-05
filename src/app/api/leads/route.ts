import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { LeadStatus, IndustryType } from '@/types';

// GET - Fetch user's leads with optional filters
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Single status (legacy) or multi-status
    const status = searchParams.get('status') as LeadStatus | null;
    const statuses = searchParams.get('statuses'); // comma-separated

    // Score range
    const minScore = searchParams.get('minScore');
    const maxScore = searchParams.get('maxScore');

    // Industry filter (single or multi)
    const industry = searchParams.get('industry');
    const industries = searchParams.get('industries'); // comma-separated

    // Follow-up filter
    const followUp = searchParams.get('followUp'); // 'today' | 'overdue' | 'this_week'

    // Tags filter
    const tags = searchParams.get('tags'); // comma-separated tag IDs

    // Sorting - whitelist allowed fields to prevent injection
    const ALLOWED_SORT_FIELDS = ['savedAt', 'leadScore', 'name', 'status', 'lastContactedAt', 'nextFollowUpAt', 'updatedAt'];
    const requestedSortBy = searchParams.get('sortBy') || 'savedAt';
    const sortBy = ALLOWED_SORT_FIELDS.includes(requestedSortBy) ? requestedSortBy : 'savedAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    // Build where clause
    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    // Multi-status filter
    if (statuses) {
      const statusList = statuses.split(',') as LeadStatus[];
      where.status = { in: statusList };
    } else if (status) {
      where.status = status;
    }

    // Score range filter
    if (minScore || maxScore) {
      where.leadScore = {};
      if (minScore) (where.leadScore as Record<string, number>).gte = parseInt(minScore);
      if (maxScore) (where.leadScore as Record<string, number>).lte = parseInt(maxScore);
    }

    // Multi-industry filter
    if (industries) {
      const industryList = industries.split(',') as IndustryType[];
      where.industryType = { in: industryList };
    } else if (industry) {
      where.industryType = industry;
    }

    // Follow-up filter
    if (followUp) {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
      const endOfWeek = new Date(startOfDay.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

      switch (followUp) {
        case 'today':
          where.nextFollowUpAt = {
            gte: startOfDay,
            lte: endOfDay,
          };
          break;
        case 'overdue':
          where.nextFollowUpAt = {
            lt: startOfDay,
            not: null,
          };
          break;
        case 'this_week':
          where.nextFollowUpAt = {
            gte: startOfDay,
            lte: endOfWeek,
          };
          break;
      }
    }

    // Tags filter - leads must have at least one of the specified tags
    if (tags) {
      const tagIds = tags.split(',');
      where.tags = {
        some: {
          tagId: { in: tagIds },
        },
      };
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      include: {
        contactLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Transform to our type format
    const transformedLeads = leads.map((lead) => ({
      id: lead.id,
      placeId: lead.placeId,
      name: lead.name,
      address: lead.address,
      phone: lead.phone,
      website: lead.website,
      rating: lead.rating,
      reviewCount: lead.reviewCount,
      industryType: lead.industryType,
      photoUrl: lead.photoUrl,
      mapsUrl: lead.mapsUrl,
      leadScore: lead.leadScore,
      scoreBreakdown: lead.scoreBreakdown ? JSON.parse(lead.scoreBreakdown) : null,
      status: lead.status,
      notes: lead.notes,
      opportunities: lead.opportunities ? JSON.parse(lead.opportunities) : [],
      lastContactedAt: lead.lastContactedAt?.toISOString(),
      nextFollowUpAt: lead.nextFollowUpAt?.toISOString(),
      savedAt: lead.savedAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
      lastContact: lead.contactLogs[0] || null,
      tags: lead.tags.map((lt) => ({
        id: lt.tag.id,
        name: lt.tag.name,
        color: lt.tag.color,
        createdAt: lt.tag.createdAt.toISOString(),
      })),
    }));

    return NextResponse.json({ leads: transformedLeads });
  } catch (error) {
    console.error('Get leads error:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

// POST - Save a new lead
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      placeId,
      name,
      address,
      phone,
      website,
      rating,
      reviewCount,
      industryType,
      photoUrl,
      mapsUrl,
      leadScore,
      scoreBreakdown,
      opportunities,
    } = body;

    if (!placeId || !name) {
      return NextResponse.json(
        { error: 'Place ID and name are required' },
        { status: 400 }
      );
    }

    // Check if already saved
    const existing = await prisma.lead.findUnique({
      where: {
        userId_placeId: {
          userId: session.user.id,
          placeId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'This business is already saved', leadId: existing.id },
        { status: 409 }
      );
    }

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        userId: session.user.id,
        placeId,
        name,
        address,
        phone,
        website,
        rating,
        reviewCount,
        industryType: industryType || 'other',
        photoUrl,
        mapsUrl,
        leadScore: leadScore || 0,
        scoreBreakdown: scoreBreakdown ? JSON.stringify(scoreBreakdown) : null,
        opportunities: opportunities ? JSON.stringify(opportunities) : '[]',
        status: 'new',
      },
    });

    return NextResponse.json({ lead, message: 'Lead saved successfully' });
  } catch (error) {
    console.error('Save lead error:', error);
    return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 });
  }
}
