import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      minlength: [2, 'Organization name must be at least 2 characters long'],
      maxlength: [100, 'Organization name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Organization slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    plan: {
      type: String,
      enum: {
        values: ['free', 'pro', 'enterprise'],
        message: '{VALUE} is not a valid plan',
      },
      default: 'free',
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'suspended', 'trial'],
        message: '{VALUE} is not a valid status',
      },
      default: 'active',
    },
    settings: {
      leadAutoAssignment: {
        type: Boolean,
        default: false,
      },
      defaultAiTone: {
        type: String,
        enum: ['professional', 'friendly', 'urgent', 'persuasive'],
        default: 'professional',
      },
      maxMonthlyAiQueries: {
        type: Number,
        default: 500,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Organization = mongoose.model('Organization', organizationSchema);

export default Organization;
