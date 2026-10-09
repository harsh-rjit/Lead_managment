import mongoose from 'mongoose';

const automationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is mandatory for multi-tenant isolation'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Automation rule name is required'],
      trim: true,
      minlength: [2, 'Automation name must be at least 2 characters'],
      maxlength: [100, 'Automation name cannot exceed 100 characters'],
    },
    trigger: {
      type: String,
      enum: ['lead_created', 'score_above', 'status_updated', 'lead_inactive_24h'],
      required: [true, 'Trigger type is required'],
    },
    condition: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    action: {
      type: String,
      enum: [
        'set_priority',
        'create_followup_activity',
        'auto_assign',
        'update_status',
        'notify_slack',
        'generate_followup',
      ],
      required: [true, 'Action type is required'],
    },
    actionConfig: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastExecutedAt: {
      type: Date,
      default: null,
    },
    executionCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for tenant-scoped rule evaluation
automationSchema.index({ organizationId: 1, trigger: 1, isActive: 1 });

const Automation = mongoose.model('Automation', automationSchema);

export default Automation;
