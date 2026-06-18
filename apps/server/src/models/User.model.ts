import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";
import type { AuthProvider, ExperienceLevel, SubscriptionPlan, UserRole } from "@linkai/types";

export interface IUserDocument extends Document {
  fullName: string;
  email: string;
  password?: string;
  avatar?: string;
  provider: AuthProvider;
  providerId?: string;
  subscriptionPlan: SubscriptionPlan;
  role: UserRole;
  emailVerified: boolean;
  refreshToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerificationToken?: string;
  profile: {
    jobTitle?: string;
    industry?: string;
    experienceLevel?: ExperienceLevel;
    onboardingCompleted: boolean;
  };
  lastLoginAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      minlength: 8,
      select: false,
    },
    avatar: {
      type: String,
      default: "",
    },
    provider: {
      type: String,
      enum: ["local", "google", "linkedin"],
      default: "local",
    },
    mobileNumber: {
  type: String,
  unique: true,
  sparse: true,
},

mobileVerified: {
  type: Boolean,
  default: false,
},

otpCode: String,
otpExpiry: Date,
otpAttempts: {
  type: Number,
  default: 0,
},

otpResendCount: {
  type: Number,
  default: 0,
},

otpLockedUntil: Date,
    providerId: {
      type: String,
      sparse: true,
    },
    subscriptionPlan: {
      type: String,
      enum: ["free", "pro", "premium"],
      default: "free",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    lastLoginAt: {
      type: Date,
    },
    profile: {
      jobTitle: { type: String, trim: true },
      industry: { type: String, trim: true },
      experienceLevel: {
        type: String,
        enum: ["entry", "mid", "senior", "executive"],
      },
      onboardingCompleted: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        const { password, refreshToken, passwordResetToken, passwordResetExpires, emailVerificationToken, __v, ...safe } = ret;
        void password;
        void refreshToken;
        void passwordResetToken;
        void passwordResetExpires;
        void emailVerificationToken;
        void __v;
        return safe;
      },
    },
  }
);

userSchema.index({ provider: 1, providerId: 1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUserDocument>("User", userSchema, "users");
