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
      default: 'gemini-3.8-flash',
    },
    // Required fields per AI specification
    score: {
      type: Number,
      min: [0, 'Score cannot be less than 0'],
      max: [100, 'Score cannot exceed 100'],
      required: [true, 'Score from 0 to 100 is required'],
    },
    priority: {
      type: String,
      enum: {
        values: ['LOW', 'MEDIUM', 'HIGH'],
        message: 'Priority must be LOW, MEDIUM, or HIGH',
      },
      uppercase: true,
      required: [true, 'Priority is required'],
      index: true,
    },
    summary: {
      type: String,
      required: [true, 'Summary is required'],
      trim: true,
    },
    reasons: {
      type: [String],
      default: [],
    },
    recommendedNextAction: {
      type: String,
      required: [true, 'Recommended next action is required'],
      trim: true,
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
