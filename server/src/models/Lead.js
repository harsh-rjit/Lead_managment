import mongoose from 'mongoose';

// Enums for strict validation across the database layer
export const LEAD_STATUS = ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'];
export const LEAD_PRIORITY = ['low', 'medium', 'high', 'urgent'];
export const LEAD_SOURCE = ['manual', 'csv', 'website', 'referral', 'linkedin', 'other'];

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
      match: [/^(|\S+@\S+\.\S+)$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      maxlength: [30, 'Phone number cannot exceed 30 characters'],
    },
    company: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Company name cannot exceed 100 characters'],
    },
    requirement: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Requirement description cannot exceed 2000 characters'],
    },
    budget: {
      type: Number,
      min: [0, 'Budget cannot be negative'],
      default: 0,
    },
    source: {
      type: String,
      enum: {
        values: LEAD_SOURCE,
        message: '{VALUE} is not a valid lead source',
      },
      default: 'manual',
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: LEAD_STATUS,
        message: '{VALUE} is not a valid lead status',
      },
      default: 'new',
      index: true,
    },
    priority: {
      type: String,
      enum: {
        values: LEAD_PRIORITY,
        message: '{VALUE} is not a valid lead priority',
      },
      default: 'medium',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// High-performance compound indexes for common tenant-scoped dashboard queries
leadSchema.index({ organizationId: 1, status: 1, priority: 1, createdAt: -1 });
leadSchema.index({ organizationId: 1, assignedTo: 1, status: 1 });
leadSchema.index({ organizationId: 1, email: 1 });

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;
