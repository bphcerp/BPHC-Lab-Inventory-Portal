import mongoose, { Schema, Document } from 'mongoose';
export interface IPeople extends Document {
  name: string;
  email?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PeopleSchema = new Schema<IPeople>({
  name: { type: String, required: true, unique: true },
  email: { type: String, unique: true },
  phone: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

PeopleSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const PeopleModel = mongoose.model<IPeople>('People', PeopleSchema);
