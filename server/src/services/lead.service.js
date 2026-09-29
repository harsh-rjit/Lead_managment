import Lead from '../models/Lead.js';
import Activity from '../models/Activity.js';
import AppError from '../utils/AppError.js';

class LeadService {
  /**
   * Create a new lead scoped strictly to the authenticated organization
   *
   * @param {string} organizationId - From authenticated JWT context
   * @param {Object} leadData - Form data
   * @param {string} userId - Authenticated user ID
   */
  async createLead(organizationId, leadData, userId) {
    // Security Invariant: Organization ID is forcefully injected from server context
    const lead = await Lead.create({
      ...leadData,
      organizationId,
      assignedTo: leadData.assignedTo || null,
    });

    // Create audit log activity
    await Activity.create({
      organizationId,
      leadId: lead._id,
      performedBy: userId,
      type: 'lead_created',
      description: `Lead '${lead.name}' created`,
    });

    return lead;
  }

  /**
   * Get all organization leads with tenant isolation and optional sales role restriction
   */
  async getLeads(organizationId, { page = 1, limit = 20, status, search, userRole, userId } = {}) {
    // 1. Root tenant partition key is ALWAYS enforced
    const query = { organizationId };

    // 2. Role-based scoping: Sales reps can only view their assigned leads
    if (userRole === 'sales') {
      query.assignedTo = userId;
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (source) {
      query.source = source;
    }

    if (assignedTo && userRole !== 'sales') {
      query.assignedTo = assignedTo;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { company: searchRegex },
        { email: searchRegex },
        { requirement: searchRegex },
      ];
    }

    const skip = (page - 1) * limit;

    const [leads, total] = await Promise.all([
      Lead.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('assignedTo', 'name email'),
      Lead.countDocuments(query),
    ]);

    return {
      leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieve a specific lead ensuring it belongs to the authenticated organization
   */
  async getLeadById(organizationId, leadId) {
    // Scoped query: If leadId belongs to Organization B, Organization A gets 404
    const lead = await Lead.findOne({ _id: leadId, organizationId }).populate('assignedTo', 'name email');
    if (!lead) {
      throw new AppError('Lead not found in this organization.', 404);
    }
    return lead;
  }

  /**
   * Update lead details within organization boundary
   */
  async updateLead(organizationId, leadId, updateData, userId) {
    // Prevent malicious tenant migration by stripping any organizationId in update payload
    delete updateData.organizationId;

    const lead = await Lead.findOneAndUpdate(
      { _id: leadId, organizationId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!lead) {
      throw new AppError('Lead not found in this organization.', 404);
    }

    if (updateData.status) {
      await Activity.create({
        organizationId,
        leadId: lead._id,
        performedBy: userId,
        type: 'status_changed',
        description: `Lead status updated to '${updateData.status}'`,
      });
    }

    return lead;
  }

  /**
   * Delete lead strictly within organization boundary
   */
  async deleteLead(organizationId, leadId) {
    const lead = await Lead.findOneAndDelete({ _id: leadId, organizationId });
    if (!lead) {
      throw new AppError('Lead not found in this organization.', 404);
    }
    return { id: leadId, deleted: true };
  }

  /**
   * Helper for Manager/Admin team overview
   */
  async getTeamLeads(organizationId) {
    return Lead.find({ organizationId }).sort({ createdAt: -1 }).limit(10);
  }

  /**
   * Helper for Sales personal leads overview
   */
  async getMyLeads(organizationId, userId) {
    return Lead.find({ organizationId, assignedTo: userId }).sort({ createdAt: -1 }).limit(10);
  }
}

export default new LeadService();
