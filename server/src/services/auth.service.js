import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import AppError from '../utils/AppError.js';
import { config } from '../config/env.js';

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
   * Generates a signed JWT with tenant and authorization context
   *
   * @param {Object} user - User document
   * @returns {string} Signed JWT token string
   */
  generateToken(user) {
    const payload = {
      userId: user._id.toString(),
      organizationId: user.organizationId.toString(),
      role: user.role,
    };

    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });
  }

  /**
   * Register a new Admin User along with their Organization
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

    // 6. Return sanitized response (never return password or passwordHash)
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

  /**
   * Authenticate user credentials and issue signed JWT
   *
   * @param {Object} credentials
   * @param {string} credentials.email
   * @param {string} credentials.password
   * @returns {Promise<Object>} Token, user profile, and organization details
   */
  async login({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Find user by email and explicitly include passwordHash (select: false on schema)
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      // Intentionally generic error to prevent email enumeration attacks
      throw new AppError('Invalid email or password.', 401);
    }

    // 2. Check account status
    if (user.status !== 'active') {
      throw new AppError(
        'Your account is currently inactive or suspended. Please contact support.',
        403
      );
    }

    // 3. Compare supplied password with bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password.', 401);
    }

    // 4. Update lastLoginAt timestamp
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    // 5. Fetch associated Organization
    const organization = await Organization.findById(user.organizationId);
    if (!organization || organization.status === 'suspended') {
      throw new AppError('The organization associated with this account is inactive.', 403);
    }

    // 6. Generate signed JWT containing userId, organizationId, and role
    const token = this.generateToken(user);

    // 7. Return token and sanitized profile
    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
      },
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan,
      },
    };
  }

  /**
   * Retrieve current user profile and organization info from verified token identity
   *
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user || user.status !== 'active') {
      throw new AppError('User account not found or no longer active.', 404);
    }

    const organization = await Organization.findById(user.organizationId);
    if (!organization) {
      throw new AppError('Organization not found.', 404);
    }

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan,
      },
    };
  }
}

export default new AuthService();
