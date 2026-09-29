/**
 * LeadService
 * Implements team-level vs representative-level lead queries.
 */
class LeadService {
  /**
   * Get all organization team leads (Manager and Admin access)
   */
  async getTeamLeads(organizationId) {
    return [
      {
        id: 'lead-101',
        name: 'Sarah Connor',
        company: 'Cyberdyne Systems',
        email: 'sarah@cyberdyne.com',
        status: 'qualified',
        assignedToRole: 'sales',
        organizationId,
        score: 92,
      },
      {
        id: 'lead-102',
        name: 'Miles Dyson',
        company: 'Tech Horizons',
        email: 'miles@techhorizons.io',
        status: 'new',
        assignedToRole: 'sales',
        organizationId,
        score: 78,
      },
    ];
  }

  /**
   * Get only leads assigned to the requesting user (Sales access)
   */
  async getMyLeads(organizationId, userId) {
    return [
      {
        id: 'lead-201',
        name: 'John Miller',
        company: 'Nexus Analytics',
        email: 'john@nexus.com',
        status: 'contacted',
        assignedToUserId: userId,
        organizationId,
        score: 85,
        note: 'Assigned strictly to current user context',
      },
    ];
  }
}

export default new LeadService();
