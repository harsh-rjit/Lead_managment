import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Prevents password hash from being included in query results by default
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'manager', 'sales'],
        message: '{VALUE} is not a valid role',
      },
      default: 'sales',
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive', 'invited', 'suspended'],
        message: '{VALUE} is not a valid status',
      },
      default: 'active',
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient tenant-scoped user lookups
userSchema.index({ organizationId: 1, role: 1 });

const User = mongoose.model('User', userSchema);

export default User;
