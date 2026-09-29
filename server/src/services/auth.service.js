import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import AppError from '../utils/AppError.js';

/**
 * Generate a clean URL-friendly slug from organization name.
 * Appends a random 4-character hex suffix to guarantee uniqueness across tenants.
 */
const generateOrgSlug = async (name) => {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  let slug = baseSlug || 'org';
  const existingOrg = await Organization.findOne({ slug });

  if (existingOrg) {
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    slug = `${baseSlug}-${randomSuffix}`;
  }

  return slug;
};

class AuthService {
  /**
   * Register a new Admin User along with their Organization
   *
   * @param {Object} registrationData
   * @param {string} registrationData.name
   * @param {string} registrationData.email
   * @param {string} registrationData.password
   * @param {string} registrationData.organizationName
   * @returns {Promise<Object>} Created user and organization records (sanitized)
   */
  async register({ name, email, password, organizationName }) {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check if user email is already registered
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new AppError(
        'An account with this email address already exists. Please sign in or use another email.',
        409
      );
    }

    // 2. Hash the password securely with bcrypt (10 salt rounds)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Generate unique organization slug
    const slug = await generateOrgSlug(organizationName);

    // 4. Create the Organization record
    const organization = await Organization.create({
      name: organizationName.trim(),
      slug,
      plan: 'free',
      status: 'active',
    });

    let user;
    try {
      // 5. Create the User assigned to the newly created Organization with 'admin' role
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        organizationId: organization._id,
        role: 'admin', // The user who creates the organization is the primary Admin
        status: 'active',
      });
    } catch (userError) {
      // Cleanup: If user creation fails, remove the created organization to prevent orphan records
      await Organization.findByIdAndDelete(organization._id);
      throw userError;
    }

    // 6. Return sanitized response (Crucial: never return password or passwordHash)
    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan,
        status: organization.status,
        createdAt: organization.createdAt,
      },
    };
  }
}

export default new AuthService();
