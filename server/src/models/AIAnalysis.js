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
    },
    modelUsed: {
      type: String,
      default: 'gemini-1.5-flash',
    },
    promptTokens: {
      type: Number,
      default: 0,
    },
    responseTokens: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    intent: {
      type: String,
      enum: ['low', 'medium', 'high', null],
      default: null,
    },
    keyInsights: {
      type: [String],
      default: [],
    },
    recommendedAction: {
      type: String,
      default: '',
    },
    generatedDraft: {
      type: String,
      default: '',
    },
    rawResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for tenant-scoped analysis lookups
aiAnalysisSchema.index({ organizationId: 1, leadId: 1 });
aiAnalysisSchema.index({ organizationId: 1, createdAt: -1 });

const AIAnalysis = mongoose.model('AIAnalysis', aiAnalysisSchema);

export default AIAnalysis;
