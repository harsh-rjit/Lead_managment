import bcrypt from 'bcrypt';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

class UserService {
  /**
   * Get all users belonging to an organization (Tenant-isolated)
   */
  async getOrganizationUsers(organizationId) {
    const users = await User.find({ organizationId }).select('-passwordHash').sort({ createdAt: -1 });
    return users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
    }));
  }

  /**
   * Invite / create a new member within the tenant organization
   */
  async inviteUser({ organizationId, name, email, password, role }) {
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new AppError('A user with this email address already exists.', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      organizationId,
      role,
      status: 'active',
    });

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    };
  }

  /**
   * Create user alias for standard REST invocation
   */
  async createUser(userData) {
    return await this.inviteUser(userData);
  }

  /**
   * Change user role (Admin only, tenant-isolated)
   */
  async updateUserRole(userId, newRole, adminUser) {
    const targetUser = await User.findOne({
      _id: userId,
      organizationId: adminUser.organizationId,
    });

    if (!targetUser) {
      throw new AppError('User not found in your organization.', 404);
    }

    // Safety guard: Prevent sole admin from demoting themselves
    if (
      String(targetUser._id) === String(adminUser.userId) &&
      newRole !== 'admin'
    ) {
      const activeAdminCount = await User.countDocuments({
        organizationId: adminUser.organizationId,
        role: 'admin',
        status: 'active',
        _id: { $ne: targetUser._id },
      });

      if (activeAdminCount === 0) {
        throw new AppError(
          'Cannot demote yourself. At least one other active admin must exist in the organization.',
          400
        );
      }
    }

    targetUser.role = newRole;
    await targetUser.save();

    return {
      id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      status: targetUser.status,
      updatedAt: targetUser.updatedAt,
    };
  }

  /**
   * Activate or deactivate user (Admin only, tenant-isolated)
   */
  async updateUserStatus(userId, newStatus, adminUser) {
    const targetUser = await User.findOne({
      _id: userId,
      organizationId: adminUser.organizationId,
    });

    if (!targetUser) {
      throw new AppError('User not found in your organization.', 404);
    }

    // Safety guard: Admin cannot deactivate themselves
    if (
      String(targetUser._id) === String(adminUser.userId) &&
      newStatus === 'inactive'
    ) {
      throw new AppError('You cannot deactivate your own account.', 400);
    }

    targetUser.status = newStatus;
    await targetUser.save();

    return {
      id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      status: targetUser.status,
      updatedAt: targetUser.updatedAt,
    };
  }
}

export default new UserService();
