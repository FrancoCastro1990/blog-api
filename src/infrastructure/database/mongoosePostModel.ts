import mongoose, { Document, Schema } from 'mongoose';

/**
 * MongoDB document interface extending the domain Post entity
 */
export interface MongoosePostDocument extends Document {
  title: string;
  content: string;
  author?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

/**
 * Mongoose schema for Post entity
 * Maps domain model to MongoDB document structure
 */
const postSchema = new Schema<MongoosePostDocument>(
  {
    title: {
      type: String,
      required: true,
      maxlength: 200,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      maxlength: 100,
      trim: true,
      default: null,
    },
    createdAt: {
      type: String,
      required: true,
    },
    updatedAt: {
      type: String,
      default: null,
    },
  },
  {
    // Disable Mongoose's version key but keep _id
    versionKey: false,
    // Use custom collection name
    collection: 'posts',
  }
);

/**
 * Create index on createdAt for efficient sorting
 */
postSchema.index({ createdAt: -1 });

/**
 * Transform function to clean up the document before returning
 */
postSchema.set('toJSON', {
  transform: (doc, ret: any) => {
    // Map MongoDB _id to our domain id field
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

/**
 * Export the Mongoose model
 */
export const MongoosePostModel = mongoose.model<MongoosePostDocument>('Post', postSchema);