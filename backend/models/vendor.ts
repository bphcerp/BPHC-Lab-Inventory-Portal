import mongoose, { Schema } from 'mongoose';

const vendorSchema = new Schema({
  name: { type: String, required: true, unique: true },
//   contactInfo: { type: String },
//   address: { type: String }
});

export const VendorModel = mongoose.model('vendors', vendorSchema);
