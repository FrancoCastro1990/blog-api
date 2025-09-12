import mongoose, { Document, Schema } from 'mongoose';

/**
 * MongoDB document interface extending the domain Post entity
 */
export interface MongoosePostDocument extends Document {
  id: string;
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
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
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
    // Disable Mongoose's automatic _id and __v fields since we use our own id
    _id: false,
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
  transform: (doc, ret) => {
    // Remove MongoDB internal fields if they exist
    const { _id, __v, ...cleanedRet } = ret;
    return cleanedRet;
  },
});

/**
 * Export the Mongoose model
 */
export const MongoosePostModel = mongoose.model<MongoosePostDocument>('Post', postSchema);