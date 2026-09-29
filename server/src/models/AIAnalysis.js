import mongoose from 'mongoose';

const aiAnalysisSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is mandatory for multi-tenant isolation'],
      index: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead ID is required for AI analysis'],
      index: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    modelUsed: {
      type: String,
      default: 'gemini-1.5-flash',
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      required: [true, 'AI Score is required'],
    },
    intent: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral',
    },
    summary: {
      type: String,
      default: '',
    },
    keyInsights: {
      type: [String],
      default: [],
    },
    recommendedAction: {
      type: String,
      default: '',
    },
    generatedFollowUpDraft: {
      type: String,
      default: '',
    },
    tokensUsed: {
      promptTokens: { type: Number, default: 0 },
      responseTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
    },
    rawGeminiResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// High-speed tenant-scoped lookups
aiAnalysisSchema.index({ organizationId: 1, leadId: 1, createdAt: -1 });

const AIAnalysis = mongoose.model('AIAnalysis', aiAnalysisSchema);

export default AIAnalysis;
