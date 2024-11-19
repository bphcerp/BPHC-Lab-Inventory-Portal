import mongoose, { Schema } from 'mongoose';

const vendorSchema = new Schema({
  name: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
});

export const VendorModel = mongoose.model('vendors', vendorSchema);
