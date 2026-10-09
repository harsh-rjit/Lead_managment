import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is mandatory for multi-tenant isolation'],
      index: true,
    },
    action: {
      type: String,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Backwards compatibility fields as real paths
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate synchronization hook
activitySchema.pre('validate', function () {
  // Sync userId and performedBy
  if (!this.userId && this.performedBy) {
    this.userId = this.performedBy;
  }
  if (!this.performedBy && this.userId) {
    this.performedBy = this.userId;
  }
  // Sync action and type
  if (!this.action && this.type) {
    this.action = this.type;
  }
  if (!this.type && this.action) {
    this.type = this.action;
  }
  // Sync description and metadata
  if (!this.metadata) {
    this.metadata = {};
  }
  if (this.description && !this.metadata.description) {
    this.metadata.description = this.description;
  }
  if (!this.description && this.metadata.description) {
    this.description = this.metadata.description;
  }

  // Validate required core fields
  if (!this.userId) {
    this.invalidate('userId', 'User ID is required');
  }
  if (!this.action) {
    this.invalidate('action', 'Action is required');
  }
});

// Compound indexes for chronological timeline and tenant audit queries
activitySchema.index({ leadId: 1, createdAt: -1 });
activitySchema.index({ organizationId: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
