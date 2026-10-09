import Automation from '../models/Automation.js';
import Lead from '../models/Lead.js';
import Activity from '../models/Activity.js';
import AppError from '../utils/AppError.js';

class AutomationService {
  /**
   * Seeds standard default automation rules for a tenant if none exist
   * @param {string} organizationId
   * @param {string} [userId]
   */
  async seedDefaultRules(organizationId, userId = null) {
    const existingRules = await Automation.find({ organizationId });
    if (existingRules.length > 0) return existingRules;

    const defaultRules = [
      {
        organizationId,
        name: 'Auto-prioritize High Scoring Leads',
        description: 'Automatically promote lead priority to HIGH when AI lead score is 80 or greater.',
        trigger: 'score_above',
        condition: { threshold: 80 },
        action: 'set_priority',
        actionConfig: { priority: 'high' },
        isActive: true,
        createdBy: userId,
      },
      {
        organizationId,
        name: '24-Hour Inactive Lead Alert',
        description: 'Create a follow-up task/activity when a lead remains NEW without any activity for 24 hours.',
        trigger: 'lead_inactive_24h',
        condition: { status: 'new', inactiveHours: 24 },
        action: 'create_followup_activity',
        actionConfig: {
          taskDescription: 'Automated 24h follow-up required: Lead has remained in NEW status without outreach.',
        },
        isActive: true,
        createdBy: userId,
      },
    ];

    return await Automation.insertMany(defaultRules);
  }

  /**
   * Rule 1: Evaluate AI Lead Score rules
   * When AI score >= 80: set lead priority to HIGH and record audit activity
   * @param {string} leadId
   * @param {number} score
   * @param {Object} [userContext]
   */
  async evaluateAiScoreRules(leadId, score, userContext = {}) {
    const lead = await Lead.findById(leadId);
    if (!lead) return { executed: false, reason: 'Lead not found' };

    const organizationId = lead.organizationId;
    const rules = await Automation.find({
      organizationId,
      trigger: 'score_above',
      isActive: true,
    });

    if (!rules || rules.length === 0) {
      return { executed: false, reason: 'No active score_above rules found' };
    }

    const executedRules = [];

    for (const rule of rules) {
      const threshold = rule.condition?.threshold ?? 80;
      if (score >= threshold) {
        const targetPriority = (rule.actionConfig?.priority || 'high').toLowerCase();
        const previousPriority = lead.priority;

        if (previousPriority !== targetPriority) {
          lead.priority = targetPriority;
          await lead.save();

          // Record non-repudiable audit activity
          await Activity.create({
            leadId: lead._id,
            userId: userContext.userId || lead.assignedTo || null,
            organizationId,
            action: 'lead_updated',
            type: 'lead_updated',
            description: `Automation rule "${rule.name}" set priority to ${targetPriority.toUpperCase()}`,
            metadata: {
              updatedFields: ['priority'],
              previousPriority,
              newPriority: targetPriority,
              aiScore: score,
              ruleId: rule._id,
              ruleName: rule.name,
              triggeredBy: 'automation',
            },
          });
        }

        // Update rule execution telemetry
        rule.lastExecutedAt = new Date();
        rule.executionCount = (rule.executionCount || 0) + 1;
        await rule.save();

        executedRules.push({
          ruleId: rule._id,
          ruleName: rule.name,
          action: rule.action,
          newPriority: targetPriority,
        });
      }
    }

    return {
      executed: executedRules.length > 0,
      executedRules,
    };
  }

  /**
   * Rule 2: Evaluate Inactive New Leads
   * When a lead remains NEW without activity for 24 hours:
   * create a follow-up task/activity with idempotency protection
   * @param {string} organizationId
   * @param {Object} [userContext]
   */
  async evaluateInactiveLeads(organizationId, userContext = {}) {
    const rules = await Automation.find({
      organizationId,
      trigger: 'lead_inactive_24h',
      isActive: true,
    });

    if (!rules || rules.length === 0) {
      return { evaluatedCount: 0, triggeredCount: 0, actions: [] };
    }

    const actions = [];

    for (const rule of rules) {
      const inactiveHours = rule.condition?.inactiveHours || 24;
      const targetStatus = rule.condition?.status || 'new';
      const cutoffTime = new Date(Date.now() - inactiveHours * 60 * 60 * 1000);

      // Find leads created before cutoff that are still in target status
      const candidateLeads = await Lead.find({
        organizationId,
        status: targetStatus,
        createdAt: { $lte: cutoffTime },
      });

      for (const lead of candidateLeads) {
        // Check if ANY activity was logged for this lead in the last 24 hours
        const recentActivity = await Activity.findOne({
          leadId: lead._id,
          createdAt: { $gt: cutoffTime },
        });

        if (recentActivity) {
          // Lead had activity within the window; not stale
          continue;
        }

        // Idempotency check: don't create multiple automated alerts within the same window
        const alreadyAlerted = await Activity.findOne({
          leadId: lead._id,
          action: 'followup_generated',
          'metadata.triggeredBy': 'automation',
          createdAt: { $gt: cutoffTime },
        });

        if (alreadyAlerted) {
          continue;
        }

        // Create follow-up task / activity
        const taskDescription =
          rule.actionConfig?.taskDescription ||
          `Automated follow-up required: Lead "${lead.name}" has remained in NEW status for >${inactiveHours} hours without outreach.`;

        await Activity.create({
          leadId: lead._id,
          userId: userContext.userId || lead.assignedTo || null,
          organizationId,
          action: 'followup_generated',
          type: 'followup_generated',
          description: `Automated Task: Lead has been in NEW status for over ${inactiveHours} hours without activity`,
          metadata: {
            leadName: lead.name,
            reason: `Lead remained in ${targetStatus.toUpperCase()} status without activity for >${inactiveHours}h`,
            taskDescription,
            suggestedAction: 'Initiate initial phone or email discovery outreach.',
            ruleId: rule._id,
            ruleName: rule.name,
            triggeredBy: 'automation',
          },
        });

        // Update rule execution metrics
        rule.lastExecutedAt = new Date();
        rule.executionCount = (rule.executionCount || 0) + 1;
        await rule.save();

        actions.push({
          leadId: lead._id,
          leadName: lead.name,
          ruleName: rule.name,
          taskDescription,
        });
      }
    }

    return {
      evaluatedCount: actions.length,
      triggeredCount: actions.length,
      actions,
    };
  }

  /**
   * Get all automation rules for tenant
   * @param {string} organizationId
   */
  async getAutomations(organizationId) {
    return await Automation.find({ organizationId }).sort({ createdAt: -1 });
  }

  /**
   * Toggle active status of a rule
   * @param {string} ruleId
   * @param {string} organizationId
   */
  async toggleAutomation(ruleId, organizationId) {
    const rule = await Automation.findOne({ _id: ruleId, organizationId });
    if (!rule) {
      throw new AppError('Automation rule not found.', 404);
    }
    rule.isActive = !rule.isActive;
    await rule.save();
    return rule;
  }

  /**
   * Queue-Ready Adapter: Process Event
   * Ready for BullMQ / Redis worker drop-in without refactoring business logic
   * @param {string} eventName
   * @param {Object} payload
   */
  async processEvent(eventName, payload) {
    switch (eventName) {
      case 'ai_analysis_completed':
        return await this.evaluateAiScoreRules(
          payload.leadId,
          payload.score,
          payload.userContext
        );
      default:
        console.warn(`[AutomationEngine] Unhandled event: ${eventName}`);
        return null;
    }
  }

  /**
   * Queue-Ready Adapter: Process Scheduled Job
   * Ready for BullMQ / Redis cron drop-in without refactoring business logic
   * @param {string} jobName
   * @param {Object} payload
   */
  async processScheduledJob(jobName, payload) {
    switch (jobName) {
      case 'check_inactive_leads':
        return await this.evaluateInactiveLeads(
          payload.organizationId,
          payload.userContext
        );
      default:
        console.warn(`[AutomationEngine] Unhandled scheduled job: ${jobName}`);
        return null;
    }
  }
}

export default new AutomationService();
