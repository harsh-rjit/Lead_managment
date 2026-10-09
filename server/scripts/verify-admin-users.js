import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { connectDB } from '../src/config/db.js';
import app from '../src/app.js';
import Organization from '../src/models/Organization.js';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verifyAdminUserManagement() {
  let server = null;
  let testOrg = null;
  let otherOrg = null;
  let adminUser = null;
  let salesUser = null;
  let otherAdmin = null;
  let createdUserId = null;

  try {
    console.log('===========================================================');
    console.log('👥 VERIFYING ADMIN USER MANAGEMENT & AUTHORIZATION CONTROLS');
    console.log('===========================================================');

    // 1. Connect to MongoDB and start Express server
    console.log('\n[Step 1] Connecting to MongoDB Atlas and starting server...');
    await connectDB();
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`✅ [Step 1] Express server active at ${baseUrl}`);

    // 2. Setup Multi-Tenant Test Data
    console.log('\n[Step 2] Setting up test tenants and users...');
    const timestamp = Date.now();
    testOrg = await Organization.create({
      name: `User Mgmt Org ${timestamp}`,
      slug: `user-mgmt-org-${timestamp}`,
      plan: 'enterprise',
    });

    otherOrg = await Organization.create({
      name: `Other Org ${timestamp}`,
      slug: `other-org-${timestamp}`,
      plan: 'free',
    });

    const dummyHash = '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLM';
    adminUser = await User.create({
      name: 'Super Admin',
      email: `admin.${timestamp}@testusermgmt.com`,
      passwordHash: dummyHash,
      role: 'admin',
      organizationId: testOrg._id,
      status: 'active',
    });

    salesUser = await User.create({
      name: 'Sales Rep Bob',
      email: `bob.${timestamp}@testusermgmt.com`,
      passwordHash: dummyHash,
      role: 'sales',
      organizationId: testOrg._id,
      status: 'active',
    });

    otherAdmin = await User.create({
      name: 'Foreign Admin Carol',
      email: `carol.${timestamp}@otherorg.com`,
      passwordHash: dummyHash,
      role: 'admin',
      organizationId: otherOrg._id,
      status: 'active',
    });

    const jwtSecret =
      process.env.JWT_SECRET || 'opsai_super_secret_jwt_key_development_2026_982dc1b7fd144309acc4';

    const adminToken = jwt.sign(
      { userId: adminUser._id, organizationId: testOrg._id, role: 'admin' },
      jwtSecret,
      { expiresIn: '1h' }
    );
    const salesToken = jwt.sign(
      { userId: salesUser._id, organizationId: testOrg._id, role: 'sales' },
      jwtSecret,
      { expiresIn: '1h' }
    );
    const otherAdminToken = jwt.sign(
      { userId: otherAdmin._id, organizationId: otherOrg._id, role: 'admin' },
      jwtSecret,
      { expiresIn: '1h' }
    );
    console.log('✅ [Step 2] Multi-tenant test accounts initialized.');

    // 3. Security: Non-Admin Rejection (HTTP 403 Forbidden)
    console.log('\n[Step 3] Testing RBAC: Non-admin users must be rejected with HTTP 403...');
    const salesGetRes = await fetch(`${baseUrl}/api/v1/users`, {
      headers: { Authorization: `Bearer ${salesToken}` },
    });
    if (salesGetRes.status !== 403) {
      throw new Error(`Expected 403 for sales user GET /users, got ${salesGetRes.status}`);
    }

    const salesPostRes = await fetch(`${baseUrl}/api/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`,
      },
      body: JSON.stringify({
        name: 'Unauthorized User',
        email: `unauth.${timestamp}@test.com`,
        password: 'Password123!',
        role: 'sales',
      }),
    });
    if (salesPostRes.status !== 403) {
      throw new Error(`Expected 403 for sales user POST /users, got ${salesPostRes.status}`);
    }

    const salesPatchRoleRes = await fetch(`${baseUrl}/api/v1/users/${adminUser._id}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`,
      },
      body: JSON.stringify({ role: 'sales' }),
    });
    if (salesPatchRoleRes.status !== 403) {
      throw new Error(`Expected 403 for sales user PATCH /role, got ${salesPatchRoleRes.status}`);
    }

    const salesPatchStatusRes = await fetch(`${baseUrl}/api/v1/users/${adminUser._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`,
      },
      body: JSON.stringify({ status: 'inactive' }),
    });
    if (salesPatchStatusRes.status !== 403) {
      throw new Error(`Expected 403 for sales user PATCH /status, got ${salesPatchStatusRes.status}`);
    }
    console.log('✅ [Step 3] Backend authorization strictly enforced: Sales role blocked on all endpoints (HTTP 403).');

    // 4. Admin: List Organization Users
    console.log('\n[Step 4] Testing Admin: List organization users (GET /api/v1/users)...');
    const listRes = await fetch(`${baseUrl}/api/v1/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();
    if (!listRes.ok) {
      throw new Error(`Failed to list users: ${JSON.stringify(listData)}`);
    }
    console.log(`   Admin retrieved ${listData.data.length} organization member(s).`);
    if (listData.data.length < 2) {
      throw new Error(`Expected at least 2 members, got ${listData.data.length}`);
    }
    console.log('✅ [Step 4] Admin successfully retrieved organization members list.');

    // 5. Admin: Add New User
    console.log('\n[Step 5] Testing Admin: Add new user (POST /api/v1/users)...');
    const createRes = await fetch(`${baseUrl}/api/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'David Marketer',
        email: `david.${timestamp}@testusermgmt.com`,
        password: 'TemporaryPassword123!',
        role: 'sales',
      }),
    });
    const createData = await createRes.json();
    if (!createRes.ok) {
      throw new Error(`Failed to create user: ${JSON.stringify(createData)}`);
    }
    createdUserId = createData.data.id || createData.data._id;
    console.log(`   User created: "${createData.data.name}" with role '${createData.data.role}' (_id: ${createdUserId})`);
    console.log('✅ [Step 5] Admin successfully added a new team member.');

    // 6. Admin: Change User Role (sales -> manager -> admin)
    console.log('\n[Step 6] Testing Admin: Change user role (PATCH /api/v1/users/:id/role)...');
    // Change to manager
    const roleManagerRes = await fetch(`${baseUrl}/api/v1/users/${createdUserId}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ role: 'manager' }),
    });
    const roleManagerData = await roleManagerRes.json();
    if (!roleManagerRes.ok || roleManagerData.data.role !== 'manager') {
      throw new Error(`Failed to update role to manager: ${JSON.stringify(roleManagerData)}`);
    }
    const dbUser1 = await User.findById(createdUserId);
    if (dbUser1.role !== 'manager') {
      throw new Error(`MongoDB role mismatch: expected 'manager', got '${dbUser1.role}'`);
    }
    console.log(`   Promoted user role to: ${dbUser1.role}`);

    // Change to admin
    const roleAdminRes = await fetch(`${baseUrl}/api/v1/users/${createdUserId}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ role: 'admin' }),
    });
    const roleAdminData = await roleAdminRes.json();
    if (!roleAdminRes.ok || roleAdminData.data.role !== 'admin') {
      throw new Error(`Failed to update role to admin: ${JSON.stringify(roleAdminData)}`);
    }
    const dbUser2 = await User.findById(createdUserId);
    if (dbUser2.role !== 'admin') {
      throw new Error(`MongoDB role mismatch: expected 'admin', got '${dbUser2.role}'`);
    }
    console.log(`   Promoted user role to: ${dbUser2.role}`);
    console.log('✅ [Step 6] Admin successfully updated user role across valid enums (admin, manager, sales).');

    // 7. Admin: Activate and Deactivate User
    console.log('\n[Step 7] Testing Admin: Deactivate and Activate user (PATCH /api/v1/users/:id/status)...');
    // Deactivate
    const deactRes = await fetch(`${baseUrl}/api/v1/users/${createdUserId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'inactive' }),
    });
    const deactData = await deactRes.json();
    if (!deactRes.ok || deactData.data.status !== 'inactive') {
      throw new Error(`Failed to deactivate user: ${JSON.stringify(deactData)}`);
    }
    const dbUserDeact = await User.findById(createdUserId);
    if (dbUserDeact.status !== 'inactive') {
      throw new Error(`MongoDB status mismatch: expected 'inactive', got '${dbUserDeact.status}'`);
    }
    console.log(`   User status updated in DB: ${dbUserDeact.status}`);

    // Reactivate
    const reactRes = await fetch(`${baseUrl}/api/v1/users/${createdUserId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'active' }),
    });
    const reactData = await reactRes.json();
    if (!reactRes.ok || reactData.data.status !== 'active') {
      throw new Error(`Failed to reactivate user: ${JSON.stringify(reactData)}`);
    }
    const dbUserReact = await User.findById(createdUserId);
    if (dbUserReact.status !== 'active') {
      throw new Error(`MongoDB status mismatch: expected 'active', got '${dbUserReact.status}'`);
    }
    console.log(`   User status updated in DB: ${dbUserReact.status}`);
    console.log('✅ [Step 7] Admin successfully deactivated and reactivated team member.');

    // 8. Security: Multi-Tenant Boundary Isolation
    console.log('\n[Step 8] Testing Multi-Tenant Boundary: Admin cannot modify users from another organization...');
    // otherAdmin attempts to modify createdUserId (which belongs to testOrg)
    const crossTenantRoleRes = await fetch(`${baseUrl}/api/v1/users/${createdUserId}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherAdminToken}`,
      },
      body: JSON.stringify({ role: 'sales' }),
    });
    if (crossTenantRoleRes.status !== 404) {
      throw new Error(`Cross-tenant breach! Expected 404, got ${crossTenantRoleRes.status}`);
    }

    const crossTenantStatusRes = await fetch(`${baseUrl}/api/v1/users/${createdUserId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherAdminToken}`,
      },
      body: JSON.stringify({ status: 'inactive' }),
    });
    if (crossTenantStatusRes.status !== 404) {
      throw new Error(`Cross-tenant breach! Expected 404, got ${crossTenantStatusRes.status}`);
    }
    console.log('✅ [Step 8] Multi-tenant boundary verified: Cross-organization modification blocked (HTTP 404).');

    // 9. Safety Guard: Admin Cannot Deactivate Themselves
    console.log('\n[Step 9] Testing Safety Guard: Admin cannot deactivate their own active account...');
    const selfDeactRes = await fetch(`${baseUrl}/api/v1/users/${adminUser._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'inactive' }),
    });
    if (selfDeactRes.status !== 400) {
      throw new Error(`Expected 400 for self-deactivation attempt, got ${selfDeactRes.status}`);
    }
    console.log('✅ [Step 9] Self-deactivation safeguard verified: System prevented admin lockout (HTTP 400).');

    console.log('\n===========================================================');
    console.log('🎉 ALL ADMIN USER MANAGEMENT TESTS PASSED SUCCESSFULLY!');
    console.log('===========================================================');
  } catch (err) {
    console.error('\n❌ Verification Failed:', err.message);
    process.exitCode = 1;
  } finally {
    console.log('\n[Cleanup] Removing temporary test records...');
    try {
      if (testOrg) {
        await User.deleteMany({ organizationId: testOrg._id });
        await Organization.deleteOne({ _id: testOrg._id });
      }
      if (otherOrg) {
        await User.deleteMany({ organizationId: otherOrg._id });
        await Organization.deleteOne({ _id: otherOrg._id });
      }
    } catch (cleanErr) {
      console.error('Cleanup error:', cleanErr);
    }

    if (server) {
      server.close();
    }
    await mongoose.disconnect();
    console.log('[Cleanup] Done.');
  }
}

verifyAdminUserManagement();
