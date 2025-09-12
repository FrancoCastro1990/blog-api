import mongoose, { Schema, Document, Types, Model } from 'mongoose';
import { User, Permission, RefreshTokenData } from '@domain/entities/User';

// Mongoose document interface
export interface UserDocument extends Document {
  email: string;
  passwordHash: string;
  permissions: Permission[];
  refreshTokens: RefreshTokenData[];
  createdAt: Date;
  updatedAt: Date;
  toDomainEntity(): User;
}

// Model interface with static methods
export interface UserModel extends Model<UserDocument> {
  fromDomainEntity(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): UserDocument;
}

// Refresh token sub-schema
const RefreshTokenSchema = new Schema<RefreshTokenData>({
  token: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// User schema
const UserSchema = new Schema<UserDocument>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Invalid email format'
    }
  },
  passwordHash: {
    type: String,
    required: true,
    minlength: 60 // bcrypt hash length
  },
  permissions: [{
    type: String,
    enum: Object.values(Permission),
    required: true
  }],
  refreshTokens: [RefreshTokenSchema]
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt
  collection: 'users'
});

// Indexes for performance
UserSchema.index({ 'refreshTokens.token': 1 });
UserSchema.index({ 'refreshTokens.expiresAt': 1 });

// Transform method to convert Mongoose document to domain entity
UserSchema.methods.toDomainEntity = function(): User {
  return {
    id: this._id.toString(),
    email: this.email,
    passwordHash: this.passwordHash,
    permissions: this.permissions,
    refreshTokens: this.refreshTokens,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Static method to create from domain entity
UserSchema.statics.fromDomainEntity = function(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
  return new this({
    email: user.email,
    passwordHash: user.passwordHash,
    permissions: user.permissions,
    refreshTokens: user.refreshTokens || []
  });
};

// Middleware to clean expired tokens before save
UserSchema.pre('save', function(next) {
  if (this.refreshTokens && this.refreshTokens.length > 0) {
    const now = new Date();
    this.refreshTokens = this.refreshTokens.filter(token => token.expiresAt > now);
  }
  next();
});

// Export the model
export const UserModel = mongoose.model<UserDocument, UserModel>('User', UserSchema);