import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';
import Lead from '../models/Lead.js';
import AIAnalysis from '../models/AIAnalysis.js';
import Activity from '../models/Activity.js';
import AppError from '../utils/AppError.js';
import { geminiAnalysisOutputSchema } from '../validations/ai.validation.js';

/**
 * JSON Schema for Gemini's structured response
 */
const ANALYSIS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    score: {
      type: 'integer',
      description: 'Lead qualification score from 0 (very unlikely/disqualified) to 100 (ready to purchase enterprise deal).',
    },
    priority: {
      type: 'string',
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      description: 'Opportunity urgency rating: LOW, MEDIUM, or HIGH based on budget, need, and buying signals.',
    },
    summary: {
      type: 'string',
      description: 'A 2-3 sentence executive assessment summarizing the prospective client, scope, and deal potential.',
    },
    reasons: {
      type: 'array',
      items: { type: 'string' },
      description: '3 to 5 clear bullet points explaining why this score and priority were determined.',
    },
    recommendedNextAction: {
      type: 'string',
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

  // 5. Call Gemini API using the official @google/genai SDK
  let rawText = '';
  let tokensUsed = { promptTokens: 0, responseTokens: 0, totalTokens: 0 };
  const modelName = 'gemini-3.8-flash';

  try {
    const aiClient = new GoogleGenAI({ apiKey });

    const interaction = await aiClient.interactions.create({
      model: modelName,
      input: prompt,
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: ANALYSIS_JSON_SCHEMA,
      },
    });

    rawText = interaction.output_text?.trim() || '';

    if (interaction.usage) {
      tokensUsed = {
        promptTokens: interaction.usage.prompt_tokens || 0,
        responseTokens: interaction.usage.response_tokens || 0,
        totalTokens: interaction.usage.total_tokens || 0,
      };
    }
  } catch (apiErr) {
    console.error('❌ [Gemini API Error]:', apiErr.message);

    // Map common Gemini API errors to clear operational messages
    if (apiErr.status === 429 || apiErr.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new AppError(
        'Gemini API rate limit exceeded. Please wait a moment and try again.',
        429
      );
    }
    if (apiErr.status === 400 || apiErr.message?.includes('API_KEY_INVALID')) {
      throw new AppError(
        'Invalid Gemini API key provided. Please verify the key in server/.env.',
        401
      );
    }
    if (apiErr.code === 'ECONNRESET' || apiErr.code === 'ETIMEDOUT') {
      throw new AppError(
        'Gemini API request timed out. Please check your network connection and retry.',
        504
      );
    }

    throw new AppError(
      `Gemini AI generation failed: ${apiErr.message || 'Unknown provider error'}`,
      502
    );
  }

  // 6. Handle and sanitize model output
  if (!rawText) {
    throw new AppError('Gemini returned an empty response. Please retry.', 502);
  }

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
    const errorDetails = validationResult.error.errors
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
    modelUsed: modelName,
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
    organizationId: user.organizationId,
    userId: user.userId,
    action: 'AI_ANALYSIS',
    entityType: 'Lead',
    entityId: lead._id,
    metadata: {
      leadName: lead.name,
      score: validatedData.score,
      priority: validatedData.priority,
      modelUsed: modelName,
    },
  }).catch((actErr) => console.warn('Activity log failed (non-critical):', actErr.message));

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
