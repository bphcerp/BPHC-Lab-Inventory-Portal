import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  pwd?: string;
  role: string;
}

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },  // Unique index for email
    pwd: { type: String, required: false },  // Optional password
    role: { type: String, required: true, enum: ['admin', 'dashboard'], default: 'dashboard' }
});

export const UserModel = mongoose.model<IUser>('User', userSchema);
