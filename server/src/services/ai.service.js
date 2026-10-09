import { GoogleGenAI, Type } from '@google/genai';
import { config } from '../config/env.js';
import Lead from '../models/Lead.js';
import AIAnalysis from '../models/AIAnalysis.js';
import Activity from '../models/Activity.js';
import AppError from '../utils/AppError.js';
import automationService from './automation.service.js';
import {
  geminiAnalysisOutputSchema,
  geminiFollowUpOutputSchema,
} from '../validations/ai.validation.js';

/**
 * Candidate Gemini models ordered by priority.
 * Falls back gracefully if a model experiences high demand or temporary outage.
 */
const CANDIDATE_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash'];

/**
 * Schema for Gemini's structured lead analysis response
 */
const ANALYSIS_JSON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.INTEGER,
      description: 'Lead qualification score from 0 (very unlikely/disqualified) to 100 (ready to purchase enterprise deal).',
    },
    priority: {
      type: Type.STRING,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      description: 'Opportunity urgency rating: LOW, MEDIUM, or HIGH based on budget, need, and buying signals.',
    },
    summary: {
      type: Type.STRING,
      description: 'A 2-3 sentence executive assessment summarizing the prospective client, scope, and deal potential.',
    },
    reasons: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '3 to 5 clear bullet points explaining why this score and priority were determined.',
    },
    recommendedNextAction: {
      type: Type.STRING,
      description: 'A specific, immediate, actionable next step for the sales representative to maximize conversion.',
    },
  },
  required: ['score', 'priority', 'summary', 'reasons', 'recommendedNextAction'],
};

/**
 * Perform AI-powered lead analysis using Google Gemini API
 *
 * @param {Object} params
 * @param {string} params.leadId - MongoDB ObjectId of lead
 * @param {Object} params.user - Authenticated user context (userId, organizationId, role, name)
 * @returns {Promise<Object>} The persisted AIAnalysis document
 */
export const analyzeLeadService = async ({ leadId, user }) => {
  // 1. Multi-tenant lookup: strictly enforce organizationId from JWT
  const lead = await Lead.findOne({
    _id: leadId,
    organizationId: user.organizationId,
  });

  if (!lead) {
    throw new AppError(
      'Lead not found or you do not have permission to access this record.',
      404
    );
  }

  // 2. Sales role authorization boundary
  if (user.role === 'sales' && lead.assignedTo && lead.assignedTo.toString() !== user.userId) {
    throw new AppError(
      'Access Denied: Sales representatives can only analyze their own assigned leads.',
      403
    );
  }

  // 3. Verify Gemini API key configuration on backend
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_') || apiKey.includes('<')) {
    throw new AppError(
      'Gemini API key is not configured on the backend. Please add GEMINI_API_KEY to server/.env.',
      503
    );
  }

  // 4. Construct concise, high-signal prompt from lead record
  const prompt = `You are an expert enterprise B2B sales development AI consultant.
Analyze the following sales lead and determine conversion probability, priority, key drivers, and the optimal next action.

=== LEAD INFORMATION ===
Name: ${lead.name}
Company: ${lead.company || 'Not provided'}
Email: ${lead.email || 'Not provided'}
Phone: ${lead.phone || 'Not provided'}
Source Channel: ${lead.source}
Current Status: ${lead.status}
Stated Budget: ${lead.budget > 0 ? '$' + lead.budget.toLocaleString() : 'Not set / 0'}
Project Requirements & Context:
${lead.requirement ? lead.requirement : 'No requirements described yet.'}
========================

Requirements for your assessment:
1. "score": Integer between 0 and 100. Consider budget size, explicit requirement clarity, and company fit.
2. "priority": Exactly one of "LOW", "MEDIUM", or "HIGH".
3. "summary": Concise executive synthesis of the deal opportunity.
4. "reasons": Array of 3 to 5 strings detailing key positive drivers and risk factors.
5. "recommendedNextAction": Direct, practical next sales step (e.g. Schedule discovery call, Request budget confirmation, Send case study, Disqualify).`;

  // 5. Call Gemini API using the official @google/genai SDK with multi-model fallback
  let rawText = '';
  let modelUsed = CANDIDATE_MODELS[0];
  let tokensUsed = { promptTokens: 0, responseTokens: 0, totalTokens: 0 };
  let lastApiError = null;

  const aiClient = new GoogleGenAI({ apiKey });

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await aiClient.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: ANALYSIS_JSON_SCHEMA,
        },
      });

      rawText = response.text?.trim() || '';
      modelUsed = model;

      if (response.usageMetadata) {
        tokensUsed = {
          promptTokens: response.usageMetadata.promptTokenCount || 0,
          responseTokens: response.usageMetadata.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata.totalTokenCount || 0,
        };
      }

      if (rawText) break;
    } catch (apiErr) {
      lastApiError = apiErr;
      console.warn(`[Gemini Lead Analysis] Model ${model} failed:`, apiErr.message);

      // Stop immediately on fatal auth errors
      if (apiErr.status === 400 || apiErr.status === 401 || apiErr.message?.includes('API_KEY_INVALID')) {
        break;
      }
    }
  }

  if (!rawText) {
    if (lastApiError) {
      console.error('❌ [Gemini API Error]:', lastApiError.message);

      if (lastApiError.status === 429 || lastApiError.message?.includes('RESOURCE_EXHAUSTED')) {
        throw new AppError(
          'Gemini API rate limit exceeded. Please wait a moment and try again.',
          429
        );
      }
      if (lastApiError.status === 401 || lastApiError.message?.includes('API_KEY_INVALID')) {
        throw new AppError(
          'Invalid Gemini API key provided. Please verify the key in server/.env.',
          401
        );
      }
      if (lastApiError.code === 'ECONNRESET' || lastApiError.code === 'ETIMEDOUT') {
        throw new AppError(
          'Gemini API request timed out. Please check your network connection and retry.',
          504
        );
      }

      throw new AppError(
        `Gemini AI generation failed: ${lastApiError.message || 'Unknown provider error'}`,
        502
      );
    }

    throw new AppError('Gemini returned an empty response. Please retry.', 502);
  }

  // 6. Handle and sanitize model output
  // Remove possible markdown formatting (e.g. ```json ... ```)
  let cleanedText = rawText;
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  let parsedOutput;
  try {
    parsedOutput = JSON.parse(cleanedText);
  } catch (jsonErr) {
    console.error('❌ Failed to parse Gemini response as JSON:', rawText);
    throw new AppError(
      'Malformed response: Gemini output could not be parsed as valid JSON.',
      502
    );
  }

  // 7. Validate structured JSON against Zod schema
  const validationResult = geminiAnalysisOutputSchema.safeParse(parsedOutput);
  if (!validationResult.success) {
    const issues = validationResult.error.issues || validationResult.error.errors || [];
    const errorDetails = issues
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('; ');
    console.error('❌ Gemini response failed Zod schema validation:', errorDetails);
    throw new AppError(
      `AI response failed schema validation: ${errorDetails}`,
      502
    );
  }

  const validatedData = validationResult.data;

  // 8. Save structured result into AIAnalysis collection (Decoupled from Lead model)
  const analysisDoc = await AIAnalysis.create({
    organizationId: user.organizationId,
    leadId: lead._id,
    performedBy: user.userId,
    modelUsed,
    score: validatedData.score,
    priority: validatedData.priority,
    summary: validatedData.summary,
    reasons: validatedData.reasons,
    recommendedNextAction: validatedData.recommendedNextAction,
    tokensUsed,
    rawGeminiResponse: parsedOutput,
  });

  // 9. Record non-blocking Activity audit log for compliance
  Activity.create({
    leadId: lead._id,
    userId: user.userId,
    organizationId: user.organizationId,
    action: 'ai_analysis_generated',
    metadata: {
      leadName: lead.name,
      score: validatedData.score,
      priority: validatedData.priority,
      summary: validatedData.summary,
      recommendedNextAction: validatedData.recommendedNextAction,
      modelUsed,
      description: `AI analyzed lead: scored ${validatedData.score}/100 (${validatedData.priority} Priority)`,
    },
  }).catch((actErr) => console.warn('Activity log failed (non-critical):', actErr.message));

  // 10. Trigger automation rules (e.g. Rule 1: score >= 80 -> HIGH priority)
  try {
    await automationService.evaluateAiScoreRules(lead._id, validatedData.score, user);
  } catch (autoErr) {
    console.warn('[AutomationEngine] Non-critical automation error:', autoErr.message);
  }

  return analysisDoc;
};

/**
 * Retrieve the latest AI analysis for a specific lead
 */
export const getLatestLeadAnalysisService = async ({ leadId, user }) => {
  // Enforce multi-tenancy: verify lead belongs to user's organization
  const lead = await Lead.findOne({
    _id: leadId,
    organizationId: user.organizationId,
  });

  if (!lead) {
    throw new AppError(
      'Lead not found or you do not have permission to access this record.',
      404
    );
  }

  const latestAnalysis = await AIAnalysis.findOne({
    leadId: lead._id,
    organizationId: user.organizationId,
  })
    .sort({ createdAt: -1 })
    .populate('performedBy', 'name email role');

  return latestAnalysis;
};

/**
 * Schema for Gemini's structured follow-up response
 */
const FOLLOW_UP_JSON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    subject: {
      type: Type.STRING,
      description: 'Engaging, professional email subject line. Empty string if short_message.',
    },
    body: {
      type: Type.STRING,
      description: 'The complete personalized follow-up message text ready for copy or sending.',
    },
    callToAction: {
      type: Type.STRING,
      description: 'The specific proposed next step or question for the lead.',
    },
  },
  required: ['body', 'callToAction'],
};

/**
 * Generate an AI-powered follow-up message tailored to a lead's profile, channel, and tone
 *
 * @param {Object} params
 * @param {string} params.leadId - MongoDB ObjectId of lead
 * @param {string} params.type - 'email' | 'short_message'
 * @param {string} params.tone - 'professional' | 'friendly'
 * @param {Object} params.user - Authenticated user context
 * @returns {Promise<Object>} Generated message and metadata
 */
export const generateFollowUpService = async ({
  leadId,
  type = 'email',
  tone = 'professional',
  user,
}) => {
  // 1. Multi-tenant lookup: strictly enforce organizationId from JWT
  const lead = await Lead.findOne({
    _id: leadId,
    organizationId: user.organizationId,
  });

  if (!lead) {
    throw new AppError(
      'Lead not found or you do not have permission to access this record.',
      404
    );
  }

  // 2. Sales role authorization boundary
  if (user.role === 'sales' && lead.assignedTo && lead.assignedTo.toString() !== user.userId) {
    throw new AppError(
      'Access Denied: Sales representatives can only generate follow-ups for their assigned leads.',
      403
    );
  }

  // 3. Verify Gemini API key configuration on backend
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_') || apiKey.includes('<')) {
    throw new AppError(
      'Gemini API key is not configured on the backend. Please add GEMINI_API_KEY to server/.env.',
      503
    );
  }

  // 4. Retrieve latest AI analysis for deeper contextual grounding if available
  const existingAnalysis = await AIAnalysis.findOne({
    leadId: lead._id,
    organizationId: user.organizationId,
  }).sort({ createdAt: -1 });

  // 5. Construct precise prompt tailored to channel and tone
  const isEmail = type === 'email';
  const isProfessional = tone === 'professional';

  const toneGuidance = isProfessional
    ? 'TONE: Highly professional, consultative, and executive. Emphasize business efficiency, measurable ROI, and domain competency.'
    : 'TONE: Friendly, warm, approachable, and relationship-centric. Establish genuine rapport while remaining respectful of their schedule.';

  const formatGuidance = isEmail
    ? `FORMAT: Formal B2B Outreach Email.
- Provide a concise, high-converting "subject" line (under 60 characters).
- In the "body", include a personalized greeting, reference to their specific business requirements, clear value proposition, and professional sign-off from "${user.name}".`
    : `FORMAT: Direct Short Message (SMS / LinkedIn InMail / WhatsApp).
- Set "subject" to an empty string ("").
- In the "body", craft a concise, high-impact message strictly under 280 characters.
- Start with a direct greeting, reference their company or project in one sentence, and conclude with a single low-friction question.`;

  const analyticalContext = existingAnalysis
    ? `Prior Deal Assessment:
- Opportunity Score: ${existingAnalysis.score}/100 (${existingAnalysis.priority} Priority)
- Strategic Assessment: ${existingAnalysis.summary}
- Strategic Next Step: ${existingAnalysis.recommendedNextAction}`
    : 'No prior AI opportunity assessment on file.';

  const prompt = `You are a world-class enterprise sales communication strategist.
Craft an optimized, highly personalized follow-up outreach message for the following prospective client.

=== PROSPECT DETAILS ===
Contact Name: ${lead.name}
Company Name: ${lead.company || 'Not provided'}
Email: ${lead.email || 'Not provided'}
Phone: ${lead.phone || 'Not provided'}
Lead Acquisition Channel: ${lead.source}
Current Pipeline Stage: ${lead.status}
Stated Budget: ${lead.budget > 0 ? '$' + lead.budget.toLocaleString() : 'Not disclosed'}
Client Requirements / Needs:
${lead.requirement || 'General interest in business operations and workflow automation solutions.'}

=== CONTEXT & INTELLIGENCE ===
Sender: ${user.name} (Sales Team)
${analyticalContext}

=== GUIDELINES ===
${formatGuidance}
${toneGuidance}

Ensure the message feels hand-crafted, directly addresses their requirements, and motivates a response without appearing pushy.`;

  // 6. Invoke Google Gemini API with multi-model fallback
  let rawText = '';
  let modelUsed = CANDIDATE_MODELS[0];
  let tokensUsed = { promptTokens: 0, responseTokens: 0, totalTokens: 0 };
  let lastApiError = null;

  const aiClient = new GoogleGenAI({ apiKey });

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await aiClient.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: FOLLOW_UP_JSON_SCHEMA,
        },
      });

      rawText = response.text?.trim() || '';
      modelUsed = model;

      if (response.usageMetadata) {
        tokensUsed = {
          promptTokens: response.usageMetadata.promptTokenCount || 0,
          responseTokens: response.usageMetadata.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata.totalTokenCount || 0,
        };
      }

      if (rawText) break;
    } catch (apiErr) {
      lastApiError = apiErr;
      console.warn(`[Gemini Follow-Up] Model ${model} failed:`, apiErr.message);

      if (apiErr.status === 400 || apiErr.status === 401 || apiErr.message?.includes('API_KEY_INVALID')) {
        break;
      }
    }
  }

  if (!rawText) {
    if (lastApiError) {
      console.error('❌ [Gemini Follow-Up API Error]:', lastApiError.message);

      if (lastApiError.status === 429 || lastApiError.message?.includes('RESOURCE_EXHAUSTED')) {
        throw new AppError(
          'Gemini API rate limit reached. Please wait a few seconds and try again.',
          429
        );
      }
      if (lastApiError.status === 401 || lastApiError.message?.includes('API_KEY_INVALID')) {
        throw new AppError(
          'Invalid Gemini API key. Please check the GEMINI_API_KEY in server/.env.',
          401
        );
      }
      if (lastApiError.code === 'ECONNRESET' || lastApiError.code === 'ETIMEDOUT') {
        throw new AppError(
          'Connection to Gemini timed out. Please check your network and retry.',
          504
        );
      }

      throw new AppError(
        `Gemini follow-up generation failed: ${lastApiError.message || 'Unknown provider error'}`,
        502
      );
    }

    throw new AppError('Gemini returned an empty response. Please retry.', 502);
  }

  // 7. Sanitize and parse JSON
  let cleanedText = rawText;
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  let parsedOutput;
  try {
    parsedOutput = JSON.parse(cleanedText);
  } catch (jsonErr) {
    console.error('❌ Failed to parse Gemini follow-up as JSON:', rawText);
    throw new AppError(
      'Malformed response: Gemini follow-up output could not be parsed as valid JSON.',
      502
    );
  }

  // 8. Validate output structure with Zod
  const validationResult = geminiFollowUpOutputSchema.safeParse(parsedOutput);
  if (!validationResult.success) {
    const issues = validationResult.error.issues || validationResult.error.errors || [];
    const errorDetails = issues
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('; ');
    console.error('❌ Gemini follow-up failed Zod validation:', errorDetails);
    throw new AppError(
      `Follow-up message failed validation: ${errorDetails}`,
      502
    );
  }

  const validatedData = validationResult.data;

  // 9. Record non-blocking audit activity
  Activity.create({
    organizationId: user.organizationId,
    leadId: lead._id,
    userId: user.userId,
    performedBy: user.userId,
    action: 'followup_generated',
    type: 'followup_generated',
    description: `Generated AI ${type} follow-up with ${tone} tone`,
    metadata: {
      leadName: lead.name,
      type,
      tone,
      modelUsed,
      description: `Generated AI ${type} follow-up with ${tone} tone`,
    },
  }).catch((actErr) => console.warn('Activity log failed (non-critical):', actErr.message));

  return {
    leadId: lead._id,
    type,
    tone,
    subject: validatedData.subject || '',
    body: validatedData.body,
    callToAction: validatedData.callToAction,
    metadata: {
      modelUsed,
      tokensUsed,
      generatedAt: new Date().toISOString(),
    },
  };
};
