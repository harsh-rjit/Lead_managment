import Lead from '../models/Lead.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import AppError from '../utils/AppError.js';
import Papa from 'papaparse';
import { csvLeadRowSchema } from '../validations/lead.validation.js';

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
      leadId: lead._id,
      userId: userContext.userId,
      organizationId,
      action: 'lead_created',
      metadata: {
        leadName: lead.name,
        company: lead.company,
        source: lead.source,
        priority: lead.priority,
        status: lead.status,
        budget: lead.budget,
        description: `Lead '${lead.name}' created by ${userContext.role}`,
      },
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
        leadId: existingLead._id,
        userId: userContext.userId,
        organizationId,
        action: 'status_changed',
        metadata: {
          previousStatus,
          newStatus: updateData.status,
          description: `Lead status changed from '${previousStatus}' to '${updateData.status}'`,
        },
      });
    }

    // Log Activity for assignments
    if (updateData.assignedTo !== undefined && updateData.assignedTo !== previousAssignedTo) {
      let assignedUserName = 'Unassigned';
      if (updateData.assignedTo) {
        const assignedUser = await User.findOne({ _id: updateData.assignedTo, organizationId }).select('name');
        if (assignedUser) assignedUserName = assignedUser.name;
      }

      await Activity.create({
        leadId: existingLead._id,
        userId: userContext.userId,
        organizationId,
        action: 'lead_assigned',
        metadata: {
          previousAssignedTo,
          newAssignedTo: updateData.assignedTo || null,
          assignedToId: updateData.assignedTo || null,
          assignedToName: assignedUserName,
          description: updateData.assignedTo
            ? `Lead assigned to ${assignedUserName}`
            : 'Lead unassigned',
        },
      });
    }

    // Log Activity for other updated fields (name, email, company, budget, requirement, priority)
    const otherFields = Object.keys(updateData).filter(
      (k) => k !== 'status' && k !== 'assignedTo' && k !== 'organizationId'
    );
    if (otherFields.length > 0) {
      await Activity.create({
        leadId: existingLead._id,
        userId: userContext.userId,
        organizationId,
        action: 'lead_updated',
        metadata: {
          updatedFields: otherFields,
          description: `Updated lead details: ${otherFields.join(', ')}`,
        },
      });
    }

    return Lead.findById(existingLead._id).populate('assignedTo', 'name email role');
  }

  /**
   * Retrieve chronological activity audit trail for a specific lead
   *
   * @param {string} organizationId - From authenticated JWT
   * @param {string} leadId - Lead ObjectId
   * @param {Object} userContext - Authenticated user context
   * @returns {Promise<Array>} Chronological list of activities
   */
  async getLeadActivities(organizationId, leadId, userContext) {
    const lead = await Lead.findOne({ _id: leadId, organizationId });

    if (!lead) {
      throw new AppError('Lead not found in this organization.', 404);
    }

    // Role-based boundary: Sales representatives can only view activities for their assigned leads
    if (
      userContext.role === 'sales' &&
      lead.assignedTo &&
      lead.assignedTo.toString() !== userContext.userId
    ) {
      throw new AppError('Access forbidden: You can only view activities for leads assigned to you.', 403);
    }

    const activities = await Activity.find({ leadId, organizationId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email role');

    return activities;
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

  /**
   * Bulk import leads from a CSV file buffer
   *
   * @param {Object} params
   * @param {Buffer} params.fileBuffer - Uploaded CSV buffer
   * @param {Object} params.userContext - Authenticated user { userId, organizationId, role }
   * @returns {Promise<Object>} Import summary metrics and validation errors
   */
  async importLeadsFromCSV({ fileBuffer, userContext }) {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new AppError('Uploaded CSV file is empty. Please provide a valid CSV file.', 400);
    }

    const csvString = fileBuffer.toString('utf-8');

    // Parse CSV using PapaParse with automatic header trimming and normalization
    const parseResult = Papa.parse(csvString, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim().toLowerCase(),
    });

    if (parseResult.errors && parseResult.errors.length > 0) {
      const fatalErrors = parseResult.errors.filter(
        (e) => e.type === 'Delimiter' || e.code === 'UndetectableDelimiter'
      );
      if (fatalErrors.length > 0 && (!parseResult.data || parseResult.data.length === 0)) {
        throw new AppError('Unable to parse CSV. Please ensure the file is valid and comma-delimited.', 400);
      }
    }

    const rows = parseResult.data;
    if (!rows || rows.length === 0) {
      throw new AppError('No data rows found in the CSV file. Please include at least one row of lead data.', 400);
    }

    const validLeads = [];
    const failedRows = [];

    // Sales users are automatically assigned to leads they import
    const defaultAssignedTo = userContext.role === 'sales' ? userContext.userId : null;

    rows.forEach((row, index) => {
      const rowNumber = index + 2; // Row 1 is header

      // Clean string values
      const cleanedRow = {};
      for (const [key, value] of Object.entries(row)) {
        cleanedRow[key] = typeof value === 'string' ? value.trim() : value;
      }

      // Skip row if completely empty
      const hasAnyValue = Object.values(cleanedRow).some(
        (v) => v !== '' && v !== null && v !== undefined
      );
      if (!hasAnyValue) {
        return;
      }

      const validation = csvLeadRowSchema.safeParse(cleanedRow);

      if (!validation.success) {
        const issues = validation.error.issues || validation.error.errors || [];
        const messages = issues.map((i) => i.message);
        failedRows.push({
          row: rowNumber,
          leadName: cleanedRow.name || `Row ${rowNumber}`,
          errors: messages,
        });
      } else {
        const validatedData = validation.data;
        validLeads.push({
          ...validatedData,
          organizationId: userContext.organizationId,
          assignedTo: defaultAssignedTo,
          source: 'csv',
        });
      }
    });

    let insertedLeads = [];
    if (validLeads.length > 0) {
      try {
        insertedLeads = await Lead.insertMany(validLeads, { ordered: false });
      } catch (insertErr) {
        if (insertErr.insertedDocs) {
          insertedLeads = insertErr.insertedDocs;
        }
        console.warn('Some leads failed during bulk insertion:', insertErr.message);
      }

      // Record Activity audit log for tenant
      Activity.create({
        organizationId: userContext.organizationId,
        performedBy: userContext.userId,
        type: 'csv_imported',
        description: `Imported ${insertedLeads.length} leads from CSV upload`,
        metadata: {
          totalRows: rows.length,
          importedCount: insertedLeads.length,
          failedCount: failedRows.length,
        },
      }).catch((actErr) => console.warn('Activity log failed (non-critical):', actErr.message));
    }

    return {
      totalRows: rows.length,
      importedCount: insertedLeads.length,
      failedCount: failedRows.length,
      errors: failedRows,
      leads: insertedLeads.slice(0, 10),
    };
  }
}

export default new LeadService();
