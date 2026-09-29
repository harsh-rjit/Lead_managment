import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is mandatory for multi-tenant isolation'],
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true,
      minlength: [2, 'Lead name must be at least 2 characters'],
      maxlength: [100, 'Lead name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    company: {
      type: String,
      trim: true,
      default: '',
    },
    source: {
      type: String,
      enum: ['manual', 'csv', 'website', 'referral', 'other'],
      default: 'manual',
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'lost', 'won'],
      default: 'new',
      index: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    scoreReason: {
      type: String,
      default: '',
    },
    aiIntent: {
      type: String,
      enum: ['low', 'medium', 'high', null],
      default: null,
    },
    suggestedFollowUp: {
      type: String,
      default: '',
    },
    customFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high-speed tenant-scoped queries
leadSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
leadSchema.index({ organizationId: 1, assignedTo: 1 });
leadSchema.index({ organizationId: 1, email: 1 });

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;
