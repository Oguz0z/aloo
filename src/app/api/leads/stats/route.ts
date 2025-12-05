import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { LeadStatus, PipelineStats } from '@/types';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all leads for the user
    const leads = await prisma.lead.findMany({
      where: { userId: session.user.id },
      select: {
        status: true,
        leadScore: true,
      },
    });

    // Calculate stats
    const total = leads.length;

    // Count by status
    const byStatus: Record<LeadStatus, number> = {
      new: 0,
      contacted: 0,
      called: 0,
      proposal_sent: 0,
      negotiating: 0,
      won: 0,
      lost: 0,
      not_interested: 0,
    };

    let totalScore = 0;
    let hotLeads = 0;
    let coldLeads = 0;

    leads.forEach((lead) => {
      byStatus[lead.status as LeadStatus]++;
      totalScore += lead.leadScore;
      if (lead.leadScore >= 55) hotLeads++;
      else if (lead.leadScore < 35) coldLeads++;
    });

    // Calculate conversion rate (won / total closed)
    const closedDeals = byStatus.won + byStatus.lost + byStatus.not_interested;
    const conversionRate = closedDeals > 0 ? (byStatus.won / closedDeals) * 100 : 0;

    // Average lead score
    const avgLeadScore = total > 0 ? Math.round(totalScore / total) : 0;

    const stats: PipelineStats = {
      total,
      byStatus,
      conversionRate: Math.round(conversionRate * 10) / 10,
      avgLeadScore,
      hotLeads,
      coldLeads,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
