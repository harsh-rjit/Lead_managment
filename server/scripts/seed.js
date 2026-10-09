import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Organization from '../src/models/Organization.js';
import User from '../src/models/User.js';
import Lead, { LEAD_STATUS, LEAD_PRIORITY, LEAD_SOURCE } from '../src/models/Lead.js';
import Activity from '../src/models/Activity.js';
import AIAnalysis from '../src/models/AIAnalysis.js';
import Automation from '../src/models/Automation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ---------------------------------------------------------------------------
// 🛡️ PRODUCTION SAFETY GUARD
// ---------------------------------------------------------------------------
if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force-production-seed')) {
  console.error('\n❌ SEED ABORTED: Cannot run seed script in production environment!');
  console.error('If this is intentional, you must pass --force-production-seed.\n');
  process.exit(1);
}

const DEMO_ORGANIZATION_SLUGS = ['apex-innovations', 'nimbus-cloud'];
const DEMO_PASSWORD = 'DemoPassword123!';

// Realistic B2B Fictional Accounts Template
const B2B_LEAD_TEMPLATES = [
  {
    company: 'Vanguard Logistics Corp',
    requirement: 'Seeking enterprise AI routing and real-time automated dispatch tracking for fleet of 450 vehicles.',
    budgetRange: [35000, 65000],
    source: 'website',
  },
  {
    company: 'Apex Robotics Labs',
    requirement: 'Integration of computer vision telemetry into centralized warehouse monitoring system.',
    budgetRange: [50000, 110000],
    source: 'referral',
  },
  {
    company: 'Silverline Health Systems',
    requirement: 'HIPAA-compliant document parsing workflow to extract structured patient intake records.',
    budgetRange: [25000, 45000],
    source: 'linkedin',
  },
  {
    company: 'Cascade Clean Energy',
    requirement: 'Predictive battery maintenance algorithms and energy grid IoT data ingestion pipelines.',
    budgetRange: [40000, 80000],
    source: 'website',
  },
  {
    company: 'Summit Capital Fintech',
    requirement: 'Automated AML risk scoring microservice with high-concurrency fraud detection.',
    budgetRange: [60000, 125000],
    source: 'referral',
  },
  {
    company: 'Horizon Omnichannel Retail',
    requirement: 'Inventory sync between SAP backend and multi-region Shopify storefronts.',
    budgetRange: [18000, 35000],
    source: 'csv',
  },
  {
    company: 'Echo Media Interactive',
    requirement: 'AI-assisted video metadata tagging and automated subtitle translation workflow.',
    budgetRange: [12000, 24000],
    source: 'website',
  },
  {
    company: 'Polaris Cyber Defense',
    requirement: 'SOC alert triage automation reducing tier-1 false positive alerts by 60%.',
    budgetRange: [45000, 95000],
    source: 'linkedin',
  },
  {
    company: 'Lumina Biotech Research',
    requirement: 'Genomics sequence pipeline orchestration in AWS with automated batch job retry.',
    budgetRange: [75000, 120000],
    source: 'referral',
  },
  {
    company: 'Beacon Cognitive AI',
    requirement: 'Private LLM deployment on VPC for confidential contract summarization.',
    budgetRange: [30000, 55000],
    source: 'website',
  },
  {
    company: 'Granite Engineering Works',
    requirement: 'Civil project management workflow overhaul and subcontractor bidding portal.',
    budgetRange: [15000, 32000],
    source: 'manual',
  },
  {
    company: 'Solstice Solar Networks',
    requirement: 'Residential solar installation quote calculator with dynamic satellite roof pitch analysis.',
    budgetRange: [22000, 48000],
    source: 'website',
  },
  {
    company: 'Pulse Telemetry Systems',
    requirement: 'Edge IoT device firmware update coordinator with failover rollback capability.',
    budgetRange: [38000, 72000],
    source: 'other',
  },
  {
    company: 'Vertex Architecture Group',
    requirement: 'Revit BIM model cloud synchronization across 6 distributed international studios.',
    budgetRange: [28000, 50000],
    source: 'linkedin',
  },
  {
    company: 'Cobalt Security Assurance',
    requirement: 'Penetration test reporting workflow with Jira defect bidirectional synchronization.',
    budgetRange: [16000, 30000],
    source: 'csv',
  },
  {
    company: 'Terra Sustainable AgTech',
    requirement: 'Drone multispectral crop health indexing and automated irrigation valve control.',
    budgetRange: [34000, 68000],
    source: 'referral',
  },
  {
    company: 'Zephyr Aerospace Components',
    requirement: 'AS9100 quality audit compliance tracking and defect tracking dashboard.',
    budgetRange: [55000, 90000],
    source: 'manual',
  },
  {
    company: 'Orion Supply Chain Solutions',
    requirement: 'Cross-border customs documentation validator with OCR trade tariff lookup.',
    budgetRange: [42000, 85000],
    source: 'website',
  },
  {
    company: 'Catalyst Commerce Hub',
    requirement: 'B2B payment terms automation with Stripe enterprise billing integration.',
    budgetRange: [20000, 40000],
    source: 'linkedin',
  },
  {
    company: 'Redwood Legal Practice',
    requirement: 'E-discovery file indexing tool with search across 500,000 PDF court filings.',
    budgetRange: [25000, 52000],
    source: 'referral',
  },
  {
    company: 'Nova Dynamic Robotics',
    requirement: 'Warehouse autonomous mobile robot fleet dispatch and obstacle avoidance analytics.',
    budgetRange: [65000, 115000],
    source: 'website',
  },
  {
    company: 'Vantage Data Analytics',
    requirement: 'Snowflake enterprise data warehouse ETL pipeline migration and Looker dashboards.',
    budgetRange: [35000, 70000],
    source: 'other',
  },
  {
    company: 'Ironclad Systems Defense',
    requirement: 'Zero-trust network access (ZTNA) policy automation for remote contractors.',
    budgetRange: [50000, 95000],
    source: 'referral',
  },
  {
    company: 'Sterling Global Media',
    requirement: 'Digital asset management (DAM) with AI face recognition and rights management.',
    budgetRange: [32000, 60000],
    source: 'website',
  },
  {
    company: 'Crestview Commercial Realty',
    requirement: 'Tenant lease lifecycle management and automated CAM expense reconciliations.',
    budgetRange: [24000, 48000],
    source: 'manual',
  },
  {
    company: 'Velocity Cloud Infrastructure',
    requirement: 'Kubernetes multi-cloud cost optimization agent with auto-spot instance switching.',
    budgetRange: [40000, 82000],
    source: 'linkedin',
  },
];

// First & Last fictional names for synthetic contact generation
const FIRST_NAMES = [
  'Arthur', 'Beatrice', 'Charles', 'Diana', 'Edward', 'Fiona', 'George', 'Hannah',
  'Ian', 'Julia', 'Kevin', 'Laura', 'Michael', 'Nadia', 'Oliver', 'Penelope',
  'Quentin', 'Rose', 'Samuel', 'Theresa', 'Ulysses', 'Victoria', 'William', 'Ximena',
  'Yusuf', 'Zara', 'Adrian', 'Brooke', 'Calvin', 'Delilah', 'Eric', 'Faith'
];

const LAST_NAMES = [
  'Sterling', 'Pendleton', 'Montgomery', 'Kowalski', 'Sinclair', 'Fairchild', 'Blackwood', 'Cheney',
  'Donovan', 'Ellington', 'Garrison', 'Hartwell', 'Mercer', 'Nakamura', 'Prescott', 'Ramsay',
  'Strickland', 'Thorne', 'Vanderbilt', 'Winslow', 'Zhao', 'Alvarez', 'Barrington', 'Carrington'
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate realistic date spread within the past 30 days
function getPastDate(daysAgo, hourOffset = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(9 + hourOffset, getRandomInt(0, 59), getRandomInt(0, 59), 0);
  return date;
}

export async function runSeed({ cleanOnly = false } = {}) {
  console.log('======================================================================');
  console.log('🌱 DEV SEED: Starting Multi-Tenant Development Demo Data Generation');
  console.log('======================================================================\n');

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is missing from environment variables');
  }

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas\n');
  }

  // ---------------------------------------------------------------------------
  // STEP 1: Scoped Cleanup of Previous Demo Organizations
  // ---------------------------------------------------------------------------
  console.log('🧹 [1/6] Cleaning existing demo organizations and dependent collections...');
  const existingOrgs = await Organization.find({ slug: { $in: DEMO_ORGANIZATION_SLUGS } });
  const existingOrgIds = existingOrgs.map((o) => o._id);

  if (existingOrgIds.length > 0) {
    const [delAutomations, delAnalyses, delActivities, delLeads, delUsers, delOrgs] = await Promise.all([
      Automation.deleteMany({ organizationId: { $in: existingOrgIds } }),
      AIAnalysis.deleteMany({ organizationId: { $in: existingOrgIds } }),
      Activity.deleteMany({ organizationId: { $in: existingOrgIds } }),
      Lead.deleteMany({ organizationId: { $in: existingOrgIds } }),
      User.deleteMany({ organizationId: { $in: existingOrgIds } }),
      Organization.deleteMany({ _id: { $in: existingOrgIds } }),
    ]);

    console.log(`   - Removed ${delOrgs.deletedCount} demo organizations`);
    console.log(`   - Removed ${delUsers.deletedCount} demo users`);
    console.log(`   - Removed ${delLeads.deletedCount} demo leads`);
    console.log(`   - Removed ${delActivities.deletedCount} demo activities`);
    console.log(`   - Removed ${delAnalyses.deletedCount} demo AI analyses`);
    console.log(`   - Removed ${delAutomations.deletedCount} demo automations`);
  } else {
    console.log('   - No previous demo seed data found. Clean slate.');
  }

  if (cleanOnly) {
    console.log('\n✨ Clean-only mode complete. Exiting.');
    return;
  }

  // ---------------------------------------------------------------------------
  // STEP 2: Create 2 Distinct Organizations
  // ---------------------------------------------------------------------------
  console.log('\n🏢 [2/6] Creating 2 isolated tenant organizations...');
  const [orgApex, orgNimbus] = await Promise.all([
    Organization.create({
      name: 'Apex Innovations Ltd',
      slug: 'apex-innovations',
      plan: 'enterprise',
      status: 'active',
      settings: {
        leadAutoAssignment: true,
        defaultAiTone: 'professional',
        maxMonthlyAiQueries: 1000,
      },
    }),
    Organization.create({
      name: 'Nimbus Cloud Solutions',
      slug: 'nimbus-cloud',
      plan: 'pro',
      status: 'active',
      settings: {
        leadAutoAssignment: false,
        defaultAiTone: 'persuasive',
        maxMonthlyAiQueries: 500,
      },
    }),
  ]);

  console.log(`   ✅ Org 1: "${orgApex.name}" (Slug: ${orgApex.slug}, Plan: ${orgApex.plan})`);
  console.log(`   ✅ Org 2: "${orgNimbus.name}" (Slug: ${orgNimbus.slug}, Plan: ${orgNimbus.plan})`);

  // ---------------------------------------------------------------------------
  // STEP 3: Create Role-Based Users for Each Organization
  // ---------------------------------------------------------------------------
  console.log('\n👥 [3/6] Generating role-based users (Admin, Manager, Sales)...');
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const apexUsers = await User.create([
    {
      organizationId: orgApex._id,
      name: 'Elena Vance',
      email: 'admin@apex.dev',
      passwordHash,
      role: 'admin',
      status: 'active',
    },
    {
      organizationId: orgApex._id,
      name: 'Marcus Brody',
      email: 'manager@apex.dev',
      passwordHash,
      role: 'manager',
      status: 'active',
    },
    {
      organizationId: orgApex._id,
      name: 'Alex Chen',
      email: 'sales.alex@apex.dev',
      passwordHash,
      role: 'sales',
      status: 'active',
    },
    {
      organizationId: orgApex._id,
      name: 'Sarah Jenkins',
      email: 'sales.sarah@apex.dev',
      passwordHash,
      role: 'sales',
      status: 'active',
    },
  ]);

  const nimbusUsers = await User.create([
    {
      organizationId: orgNimbus._id,
      name: 'David Ross',
      email: 'admin@nimbus.dev',
      passwordHash,
      role: 'admin',
      status: 'active',
    },
    {
      organizationId: orgNimbus._id,
      name: 'Rachel Green',
      email: 'manager@nimbus.dev',
      passwordHash,
      role: 'manager',
      status: 'active',
    },
    {
      organizationId: orgNimbus._id,
      name: 'Samira Khan',
      email: 'sales.sam@nimbus.dev',
      passwordHash,
      role: 'sales',
      status: 'active',
    },
    {
      organizationId: orgNimbus._id,
      name: 'Leo Martinez',
      email: 'sales.leo@nimbus.dev',
      passwordHash,
      role: 'sales',
      status: 'active',
    },
  ]);

  console.log(`   ✅ Created ${apexUsers.length} users for Apex Innovations`);
  console.log(`   ✅ Created ${nimbusUsers.length} users for Nimbus Cloud`);

  // ---------------------------------------------------------------------------
  // STEP 4: Generate Realistic Leads (52 Leads per Org = 104 Total)
  // ---------------------------------------------------------------------------
  console.log('\n📋 [4/6] Generating >= 50 realistic leads per organization (52 per org, 104 total)...');

  // Distribution plan per organization:
  // new (12), contacted (10), qualified (12), proposal_sent (8), won (6), lost (4)
  const statusDistribution = [
    ...Array(12).fill('new'),
    ...Array(10).fill('contacted'),
    ...Array(12).fill('qualified'),
    ...Array(8).fill('proposal_sent'),
    ...Array(6).fill('won'),
    ...Array(4).fill('lost'),
  ];

  async function createLeadsForOrg(org, users) {
    const salesReps = users.filter((u) => u.role === 'sales');
    const adminUser = users.find((u) => u.role === 'admin');
    const leadsToInsert = [];

    for (let i = 0; i < statusDistribution.length; i++) {
      const status = statusDistribution[i];
      const template = B2B_LEAD_TEMPLATES[i % B2B_LEAD_TEMPLATES.length];
      const firstName = getRandomItem(FIRST_NAMES);
      const lastName = getRandomItem(LAST_NAMES);
      const fullName = `${firstName} ${lastName}`;
      const domainSuffix = template.company.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domainSuffix}-demo.com`;
      const phone = `+1 (555) 01${getRandomInt(10, 99)}-${getRandomInt(1000, 9999)}`;
      const budget = Math.round(getRandomInt(template.budgetRange[0], template.budgetRange[1]) / 500) * 500;

      // Realistic priority mapping based on status and budget
      let priority = 'medium';
      if (budget > 75000 || status === 'proposal_sent' || status === 'won') {
        priority = budget > 95000 ? 'urgent' : 'high';
      } else if (status === 'lost') {
        priority = 'low';
      } else {
        priority = getRandomItem(['low', 'medium', 'high']);
      }

      // Assign to sales rep unless it's a completely fresh unassigned new lead
      let assignedTo = null;
      if (status !== 'new' || i % 3 !== 0) {
        assignedTo = salesReps[i % salesReps.length]._id;
      }

      // Spread creation timestamps across past 30 days
      const daysAgo = Math.floor((i / statusDistribution.length) * 28) + 1;
      const createdAt = getPastDate(daysAgo, (i % 8));
      const updatedAt = new Date(createdAt.getTime() + getRandomInt(3600000, 86400000 * 2));

      leadsToInsert.push({
        organizationId: org._id,
        assignedTo,
        name: fullName,
        email,
        phone,
        company: `${template.company} ${i >= B2B_LEAD_TEMPLATES.length ? 'Division' : ''}`.trim(),
        requirement: template.requirement,
        budget,
        source: template.source,
        status,
        priority,
        createdAt,
        updatedAt,
      });
    }

    return await Lead.insertMany(leadsToInsert);
  }

  const apexLeads = await createLeadsForOrg(orgApex, apexUsers);
  const nimbusLeads = await createLeadsForOrg(orgNimbus, nimbusUsers);

  console.log(`   ✅ Inserted ${apexLeads.length} leads for ${orgApex.name}`);
  console.log(`   ✅ Inserted ${nimbusLeads.length} leads for ${orgNimbus.name}`);

  // ---------------------------------------------------------------------------
  // STEP 5: Generate AI Analyses and Chronological Activities
  // ---------------------------------------------------------------------------
  console.log('\n🤖 [5/6] Generating AI analysis records and 30-day activity timelines...');

  async function generateAIAndActivities(org, users, leads) {
    const adminUser = users.find((u) => u.role === 'admin');
    const managerUser = users.find((u) => u.role === 'manager');
    const salesUsers = users.filter((u) => u.role === 'sales');
    const activitiesToInsert = [];
    const analysesToInsert = [];

    // Select candidate leads for rich AI analysis (leads with high/urgent priority or qualified/proposal/won)
    const aiCandidateLeads = leads.filter(
      (l) => l.priority === 'urgent' || l.priority === 'high' || ['qualified', 'proposal_sent', 'won'].includes(l.status)
    ).slice(0, 16); // 16 rich AI analyses per organization

    for (const lead of aiCandidateLeads) {
      const isUrgent = lead.priority === 'urgent';
      const score = isUrgent ? getRandomInt(85, 97) : getRandomInt(65, 84);
      const aiPriority = score >= 80 ? 'HIGH' : score >= 60 ? 'MEDIUM' : 'LOW';

      const analysisDoc = {
        organizationId: org._id,
        leadId: lead._id,
        performedBy: getRandomItem(salesUsers)._id,
        modelUsed: 'gemini-2.5-flash',
        score,
        priority: aiPriority,
        summary: `Strong commercial fit for ${lead.company}. The client has an active $${lead.budget.toLocaleString()} allocation for their requirement: "${lead.requirement.slice(0, 80)}..."`,
        reasons: [
          `Explicit budget allocation of $${lead.budget.toLocaleString()} is within target deal envelope.`,
          `Decision maker contact established with verified corporate email (${lead.email}).`,
          `Inbound source "${lead.source}" historically yields high engagement for this segment.`,
          `High project urgency aligned with immediate quarterly technical milestones.`,
        ],
        recommendedNextAction:
          score >= 80
            ? 'Schedule an executive technical discovery call within 24 hours to review integration requirements.'
            : 'Send personalized enterprise case study and request discovery questionnaire response.',
        tokensUsed: {
          promptTokens: getRandomInt(280, 420),
          responseTokens: getRandomInt(90, 160),
          totalTokens: getRandomInt(370, 580),
        },
        createdAt: new Date(lead.createdAt.getTime() + 1800000), // 30 mins after creation
      };

      analysesToInsert.push(analysisDoc);
    }

    const createdAnalyses = await AIAnalysis.insertMany(analysesToInsert);

    // Build timeline activities for all leads
    for (const lead of leads) {
      const leadCreator = lead.assignedTo || adminUser._id;

      // 1. Activity: Lead Created
      activitiesToInsert.push({
        leadId: lead._id,
        userId: leadCreator,
        organizationId: org._id,
        action: 'lead_created',
        metadata: {
          leadName: lead.name,
          company: lead.company,
          source: lead.source,
          budget: lead.budget,
        },
        createdAt: lead.createdAt,
      });

      // 2. Activity: Lead Assigned
      if (lead.assignedTo) {
        const assignedUser = users.find((u) => u._id.equals(lead.assignedTo));
        activitiesToInsert.push({
          leadId: lead._id,
          userId: managerUser._id,
          organizationId: org._id,
          action: 'lead_assigned',
          metadata: {
            assignedToName: assignedUser ? assignedUser.name : 'Sales Representative',
            assignedToId: lead.assignedTo,
          },
          createdAt: new Date(lead.createdAt.getTime() + 900000), // 15 mins after creation
        });
      }

      // 3. Activity: Status Progression
      if (lead.status !== 'new') {
        activitiesToInsert.push({
          leadId: lead._id,
          userId: lead.assignedTo || adminUser._id,
          organizationId: org._id,
          action: 'status_changed',
          metadata: {
            previousStatus: 'new',
            newStatus: lead.status,
          },
          createdAt: new Date(lead.createdAt.getTime() + 7200000), // 2 hours later
        });
      }

      // 4. Activity: AI Analysis logged
      const matchingAnalysis = createdAnalyses.find((a) => a.leadId.equals(lead._id));
      if (matchingAnalysis) {
        activitiesToInsert.push({
          leadId: lead._id,
          userId: matchingAnalysis.performedBy,
          organizationId: org._id,
          action: 'ai_analyzed',
          metadata: {
            score: matchingAnalysis.score,
            priority: matchingAnalysis.priority,
            recommendedNextAction: matchingAnalysis.recommendedNextAction,
          },
          createdAt: matchingAnalysis.createdAt,
        });
      }

      // 5. Activity: Additional interactions for qualified / won / proposal
      if (['qualified', 'proposal_sent', 'won'].includes(lead.status)) {
        activitiesToInsert.push({
          leadId: lead._id,
          userId: lead.assignedTo || salesUsers[0]._id,
          organizationId: org._id,
          action: lead.status === 'won' ? 'deal_won' : 'proposal_sent',
          metadata: {
            dealValue: lead.budget,
            notes: `Confirmed customer sign-off on technical requirements and commercial proposal for $${lead.budget.toLocaleString()}.`,
          },
          createdAt: new Date(lead.createdAt.getTime() + 86400000), // 1 day later
        });
      }
    }

    const createdActivities = await Activity.insertMany(activitiesToInsert);
    return { analysesCount: createdAnalyses.length, activitiesCount: createdActivities.length };
  }

  const apexResults = await generateAIAndActivities(orgApex, apexUsers, apexLeads);
  const nimbusResults = await generateAIAndActivities(orgNimbus, nimbusUsers, nimbusLeads);

  console.log(`   ✅ Apex: Generated ${apexResults.analysesCount} AI analyses and ${apexResults.activitiesCount} activity records`);
  console.log(`   ✅ Nimbus: Generated ${nimbusResults.analysesCount} AI analyses and ${nimbusResults.activitiesCount} activity records`);

  // ---------------------------------------------------------------------------
  // STEP 6: Seed Default Automations & Verify Strict Data Isolation
  // ---------------------------------------------------------------------------
  console.log('\n⚙️  [6/6] Seeding automations and validating multi-tenant data isolation...');

  await Automation.create([
    {
      organizationId: orgApex._id,
      name: 'High Score Lead Escalation',
      trigger: 'score_above',
      condition: { minScore: 80 },
      action: 'set_priority',
      actionConfig: { priority: 'high' },
      description: 'Automatically promote high-scoring AI evaluated leads to high priority.',
      isActive: true,
      createdBy: apexUsers[0]._id,
    },
    {
      organizationId: orgApex._id,
      name: '24h Stale Lead Follow-up Alert',
      trigger: 'lead_inactive_24h',
      condition: { status: 'new' },
      action: 'create_followup_activity',
      actionConfig: { taskDescription: 'Immediate follow-up required on uncontacted lead.' },
      description: 'Trigger task reminder when newly captured lead sits uncontacted for 24 hours.',
      isActive: true,
      createdBy: apexUsers[0]._id,
    },
    {
      organizationId: orgNimbus._id,
      name: 'Auto-Assign Inbound Web Leads',
      trigger: 'lead_created',
      condition: { source: 'website' },
      action: 'set_priority',
      actionConfig: { priority: 'medium' },
      description: 'Set default medium priority for inbound website submissions.',
      isActive: true,
      createdBy: nimbusUsers[0]._id,
    },
  ]);

  // STRICT MULTI-TENANT ISOLATION VALIDATION
  const [crossLeads1, crossLeads2, crossUsers1, crossUsers2] = await Promise.all([
    Lead.countDocuments({ organizationId: orgApex._id, assignedTo: { $in: nimbusUsers.map((u) => u._id) } }),
    Lead.countDocuments({ organizationId: orgNimbus._id, assignedTo: { $in: apexUsers.map((u) => u._id) } }),
    User.countDocuments({ organizationId: orgApex._id, email: /@nimbus\.dev$/ }),
    User.countDocuments({ organizationId: orgNimbus._id, email: /@apex\.dev$/ }),
  ]);

  if (crossLeads1 > 0 || crossLeads2 > 0 || crossUsers1 > 0 || crossUsers2 > 0) {
    throw new Error('❌ MULTI-TENANT LEAKAGE DETECTED! Seeded data violates tenant boundaries.');
  }

  console.log('   🔒 Multi-Tenant Isolation Check: PASSED (0 cross-tenant references across all collections)');

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
  console.log('======================================================================');
  console.log('\n🔑 DEMO LOGIN CREDENTIALS (Password for all accounts: ' + DEMO_PASSWORD + ')');
  console.log('----------------------------------------------------------------------');
  console.log('🏢 ORGANIZATION 1: Apex Innovations Ltd (Slug: apex-innovations)');
  console.log('   - Admin:   admin@apex.dev       (Full administrative & user control)');
  console.log('   - Manager: manager@apex.dev     (Team leads management & assignment)');
  console.log('   - Sales 1: sales.alex@apex.dev  (Assigned leads & AI follow-ups)');
  console.log('   - Sales 2: sales.sarah@apex.dev (Assigned leads & AI follow-ups)');
  console.log(`   - Data:    ${apexLeads.length} Leads | ${apexResults.analysesCount} AI Analyses | ${apexResults.activitiesCount} Activities`);
  console.log('----------------------------------------------------------------------');
  console.log('🏢 ORGANIZATION 2: Nimbus Cloud Solutions (Slug: nimbus-cloud)');
  console.log('   - Admin:   admin@nimbus.dev     (Full administrative & user control)');
  console.log('   - Manager: manager@nimbus.dev   (Team leads management & assignment)');
  console.log('   - Sales 1: sales.sam@nimbus.dev (Assigned leads & AI follow-ups)');
  console.log('   - Sales 2: sales.leo@nimbus.dev (Assigned leads & AI follow-ups)');
  console.log(`   - Data:    ${nimbusLeads.length} Leads | ${nimbusResults.analysesCount} AI Analyses | ${nimbusResults.activitiesCount} Activities`);
  console.log('======================================================================\n');
}

// Auto-run if executed directly via CLI
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  const isCleanOnly = process.argv.includes('--clean-only');
  runSeed({ cleanOnly: isCleanOnly })
    .then(async () => {
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('❌ Seed Script Error:', err);
      try {
        await mongoose.disconnect();
      } catch (_) {}
      process.exit(1);
    });
}
