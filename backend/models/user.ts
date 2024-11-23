import mongoose, { Document, Schema } from 'mongoose';

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },  // Unique index for email
    pwd: { type: String, required: false }  // Optional password
});

export const UserModel = mongoose.model('User', userSchema);
