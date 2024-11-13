import mongoose, { Schema } from 'mongoose';

const vendorSchema = new Schema({
  name: { type: String, required: true, unique: true },
  comment: { type: String },
});

export const VendorModel = mongoose.model('vendors', vendorSchema);
