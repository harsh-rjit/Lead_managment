import Lead from '../models/Lead.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import AppError from '../utils/AppError.js';

class LeadService {
  /**
   * Create a new lead scoped strictly to the authenticated organization
   *
   * @param {string} organizationId - From authenticated JWT
   * @param {Object} leadData - Form data
   * @param {Object} userContext - Authenticated user context { userId, role }
   */
  async createLead(organizationId, leadData, userContext) {
    let assignedTo = leadData.assignedTo || null;

    // Sales users are automatically assigned to the leads they create
    if (userContext.role === 'sales') {
      assignedTo = userContext.userId;
    } else if (assignedTo) {
      // Validate that the assigned user exists within the SAME organization
      const targetUser = await User.findOne({ _id: assignedTo, organizationId });
      if (!targetUser) {
        throw new AppError('The assigned team member does not exist within your organization.', 400);
      }
    }

    // Never trust client organizationId; forcefully bind from JWT context
    const lead = await Lead.create({
      ...leadData,
      organizationId,
      assignedTo,
    });

    // Record audit activity log
    await Activity.create({
      organizationId,
      leadId: lead._id,
      performedBy: userContext.userId,
      type: 'lead_created',
      description: `Lead '${lead.name}' created by ${userContext.role}`,
      metadata: { source: lead.source, priority: lead.priority, status: lead.status },
    });

    return Lead.findById(lead._id).populate('assignedTo', 'name email role');
  }

  /**
   * Query leads with tenant isolation, role scoping, search, filters, and pagination
   */
  async getLeads(organizationId, queryOptions = {}, userContext) {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      source,
      assignedTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryOptions;

    // 1. Tenant Partition Key: ALWAYS required
    const filter = { organizationId };

    // 2. Role-Based Scoping: Sales users can only access their assigned leads
    if (userContext.role === 'sales') {
      filter.assignedTo = userContext.userId;
    } else if (assignedTo) {
      // Admins and Managers can filter by any team member
      filter.assignedTo = assignedTo;
    }

    // 3. Status filter
    if (status) {
      filter.status = status;
    }

    // 4. Priority filter
    if (priority) {
      filter.priority = priority;
    }

    // 5. Source filter
    if (source) {
      filter.source = source;
    }

    // 6. Multi-field text search
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { company: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { requirement: searchRegex },
      ];
    }

    // Pagination calculations
    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit)
        .populate('assignedTo', 'name email role'),
      Lead.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Retrieve a single lead by ID, enforcing tenant isolation and ownership
   */
  async getLeadById(organizationId, leadId, userContext) {
    const lead = await Lead.findOne({ _id: leadId, organizationId }).populate(
      'assignedTo',
      'name email role'
    );

    if (!lead) {
      throw new AppError('Lead not found in this organization.', 404);
    }

    // Role ownership guard: Sales cannot inspect other reps' leads
    if (userContext.role === 'sales' && lead.assignedTo?._id?.toString() !== userContext.userId) {
      throw new AppError('Access forbidden: You are not authorized to view this lead.', 403);
    }

    return lead;
  }

  /**
   * Update lead details (PUT / PATCH)
   */
  async updateLead(organizationId, leadId, updateData, userContext) {
    const existingLead = await Lead.findOne({ _id: leadId, organizationId });

    if (!existingLead) {
      throw new AppError('Lead not found in this organization.', 404);
    }

    // Role ownership guard: Sales can only update their own assigned leads
    if (
      userContext.role === 'sales' &&
      existingLead.assignedTo?.toString() !== userContext.userId
    ) {
      throw new AppError('Access forbidden: You can only update leads assigned to you.', 403);
    }

    // Sales cannot reassign leads to others
    if (userContext.role === 'sales' && updateData.assignedTo !== undefined) {
      delete updateData.assignedTo;
    }

    // If reassignment is requested by Admin/Manager, ensure target user belongs to same tenant
    if (updateData.assignedTo && updateData.assignedTo !== existingLead.assignedTo?.toString()) {
      const targetUser = await User.findOne({ _id: updateData.assignedTo, organizationId });
      if (!targetUser) {
        throw new AppError('The assigned user does not belong to your organization.', 400);
      }
    }

    // Strip organizationId to prevent cross-tenant migration
    delete updateData.organizationId;

    const previousStatus = existingLead.status;
    const previousAssignedTo = existingLead.assignedTo?.toString();

    // Apply updates
    Object.assign(existingLead, updateData);
    await existingLead.save();

    // Log Activity for status transitions
    if (updateData.status && updateData.status !== previousStatus) {
      await Activity.create({
        organizationId,
        leadId: existingLead._id,
        performedBy: userContext.userId,
        type: 'status_changed',
        description: `Lead status updated from '${previousStatus}' to '${updateData.status}'`,
      });
    }

    // Log Activity for assignments
    if (updateData.assignedTo && updateData.assignedTo !== previousAssignedTo) {
      await Activity.create({
        organizationId,
        leadId: existingLead._id,
        performedBy: userContext.userId,
        type: 'assigned',
        description: `Lead reassigned to user ${updateData.assignedTo}`,
      });
    }

    return Lead.findById(existingLead._id).populate('assignedTo', 'name email role');
  }

  /**
   * Delete lead strictly within tenant boundary (Admin and Manager only)
   */
  async deleteLead(organizationId, leadId, userContext) {
    if (userContext.role === 'sales') {
      throw new AppError('Access forbidden: Sales representatives cannot delete leads.', 403);
    }

    const lead = await Lead.findOneAndDelete({ _id: leadId, organizationId });

    if (!lead) {
      throw new AppError('Lead not found in this organization.', 404);
    }

    // Clean up associated activity logs
    await Activity.deleteMany({ leadId, organizationId });

    return { id: leadId, deleted: true };
  }
}

export default new LeadService();
