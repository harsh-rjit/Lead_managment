import Organization from '../models/Organization.js';
import AppError from '../utils/AppError.js';

class OrganizationService {
  /**
   * Get organization profile and settings
   */
  async getOrganization(organizationId) {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new AppError('Organization not found.', 404);
    }
    return organization;
  }

  /**
   * Update organization settings (Admin only)
   */
  async updateOrganization(organizationId, updateData) {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new AppError('Organization not found.', 404);
    }

    if (updateData.name) organization.name = updateData.name.trim();
    if (updateData.settings) {
      organization.settings = {
        ...organization.settings.toObject(),
        ...updateData.settings,
      };
    }

    await organization.save();
    return organization;
  }
}

export default new OrganizationService();
