import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { connectDB } from '../../src/config/db.js';
import { config } from '../../src/config/env.js';
import app from '../../src/app.js';
import Organization from '../../src/models/Organization.js';
import User from '../../src/models/User.js';
import Lead from '../../src/models/Lead.js';
import Activity from '../../src/models/Activity.js';
import AIAnalysis from '../../src/models/AIAnalysis.js';
import Automation from '../../src/models/Automation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

let serverInstance = null;
let baseUrl = '';

const PRECOMPUTED_PASSWORD_HASH = '$2b$10$EP/sD.5vXzWw9q3.0sZ9eeZ/d3E5KkQxP06iE4GZ24aB3pA3dEcm.';

/**
 * Start the test server on an ephemeral random port and ensure DB connection.
 */
export async function setupTestServer() {
  if (mongoose.connection.readyState === 0) {
    await connectDB();
  }

  if (!serverInstance) {
    serverInstance = app.listen(0);
    await new Promise((resolve) => serverInstance.once('listening', resolve));
    const port = serverInstance.address().port;
    baseUrl = `http://localhost:${port}`;
  }

  return { server: serverInstance, baseUrl };
}

/**
 * Gracefully stop the test server, terminate open sockets, and close Mongoose connection pool.
 */
export async function closeTestServer() {
  if (serverInstance) {
    if (typeof serverInstance.closeAllConnections === 'function') {
      serverInstance.closeAllConnections();
    }
    await new Promise((resolve) => serverInstance.close(resolve));
    serverInstance = null;
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

/**
 * Universal API request wrapper using native fetch.
 */
export async function api(method, endpoint, options = {}) {
  const { token, body, headers = {}, isFormData = false } = options;

  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const requestHeaders = {
    Connection: 'close',
    ...headers,
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  let requestBody = body;
  if (body && !isFormData && typeof body === 'object') {
    requestHeaders['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: requestBody,
    keepalive: false,
  });

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return {
    status: response.status,
    ok: response.ok,
    headers: response.headers,
    data,
  };
}

/**
 * Create a new isolated test organization.
 */
export async function createTestOrg(prefix = 'TestOrg') {
  const timestamp = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const org = await Organization.create({
    name: `${prefix} ${timestamp}`,
    slug: `${prefix.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}`,
    plan: 'enterprise',
  });
  return org;
}

/**
 * Create a test user directly in DB and generate a signed JWT.
 */
export async function createTestUser({
  organizationId,
  role = 'sales',
  name = 'Test User',
  email = null,
  status = 'active',
  customPassword = null,
}) {
  const timestamp = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const userEmail = email || `user.${timestamp}@testdomain.com`;

  let passwordHash = PRECOMPUTED_PASSWORD_HASH;
  if (customPassword) {
    passwordHash = await bcrypt.hash(customPassword, 10);
  }

  const user = await User.create({
    name,
    email: userEmail.toLowerCase().trim(),
    passwordHash,
    role,
    organizationId,
    status,
  });

  const token = jwt.sign(
    {
      userId: user._id.toString(),
      organizationId: organizationId.toString(),
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  return { user, token };
}

/**
 * Clean up all records associated with a test organization.
 */
export async function cleanupTenantData(organizationId) {
  if (!organizationId) return;

  await Promise.all([
    Lead.deleteMany({ organizationId }),
    User.deleteMany({ organizationId }),
    Activity.deleteMany({ organizationId }),
    AIAnalysis.deleteMany({ organizationId }),
    Automation.deleteMany({ organizationId }),
    Organization.findByIdAndDelete(organizationId),
  ]);
}
