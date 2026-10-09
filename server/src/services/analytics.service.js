import mongoose from 'mongoose';
import Lead from '../models/Lead.js';
import AIAnalysis from '../models/AIAnalysis.js';

class AnalyticsService {
  /**
   * Calculate organization analytics overview from MongoDB
   * @param {string} organizationId
   */
  async getOverview(organizationId) {
    const orgObjectId = new mongoose.Types.ObjectId(organizationId.toString());

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [leadMetrics, aiMetrics] = await Promise.all([
      Lead.aggregate([
        { $match: { organizationId: orgObjectId } },
        {
          $facet: {
            totalCount: [{ $count: 'count' }],
            byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
            bySource: [{ $group: { _id: '$source', count: { $sum: 1 } } }],
            leadsOverTime: [
              { $match: { createdAt: { $gte: thirtyDaysAgo } } },
              {
                $group: {
                  _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                  },
                  count: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ],
          },
        },
      ]),
      AIAnalysis.aggregate([
        { $match: { organizationId: orgObjectId } },
        {
          $group: {
            _id: null,
            avgScore: { $avg: '$score' },
            totalAnalyses: { $sum: 1 },
          },
        },
      ]),
    ]);

    const facet = leadMetrics[0] || {};
    const totalLeads = facet.totalCount?.[0]?.count || 0;

    // Status map with zero defaults
    const leadsByStatus = {
      new: 0,
      contacted: 0,
      qualified: 0,
      proposal_sent: 0,
      won: 0,
      lost: 0,
    };
    (facet.byStatus || []).forEach((item) => {
      if (item._id) {
        leadsByStatus[item._id] = item.count;
      }
    });

    // Source map with zero defaults
    const leadsBySource = {
      website: 0,
      referral: 0,
      csv: 0,
      manual: 0,
      linkedin: 0,
      other: 0,
    };
    (facet.bySource || []).forEach((item) => {
      if (item._id) {
        leadsBySource[item._id] = item.count;
      }
    });

    const qualifiedLeads = leadsByStatus.qualified || 0;
    const wonLeads = leadsByStatus.won || 0;
    const lostLeads = leadsByStatus.lost || 0;

    // Conversion rate: (wonLeads / totalLeads) * 100
    const conversionRate =
      totalLeads > 0
        ? parseFloat(((wonLeads / totalLeads) * 100).toFixed(1))
        : 0;

    // Closed win rate: won / (won + lost)
    const closedDeals = wonLeads + lostLeads;
    const closedWinRate =
      closedDeals > 0
        ? parseFloat(((wonLeads / closedDeals) * 100).toFixed(1))
        : 0;

    // Average AI score
    const avgScoreRaw = aiMetrics[0]?.avgScore;
    const averageAiScore = avgScoreRaw != null ? Math.round(avgScoreRaw) : null;
    const totalAiAnalyses = aiMetrics[0]?.totalAnalyses || 0;

    // Continuous date timeline for last 30 days
    const timeMap = new Map();
    (facet.leadsOverTime || []).forEach((item) => {
      timeMap.set(item._id, item.count);
    });

    // Continuous date timeline for last 30 days in UTC (matching MongoDB's $dateToString)
    const formattedLeadsOverTime = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
      const dateStr = d.toISOString().split('T')[0];
      formattedLeadsOverTime.push({
        date: dateStr,
        leads: timeMap.get(dateStr) || 0,
      });
    }

    return {
      totalLeads,
      qualifiedLeads,
      wonLeads,
      lostLeads,
      conversionRate,
      closedWinRate,
      averageAiScore,
      totalAiAnalyses,
      leadsByStatus,
      leadsBySource,
      leadsOverTime: formattedLeadsOverTime,
    };
  }
}

export default new AnalyticsService();
