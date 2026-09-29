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
}

export default new UserService();
