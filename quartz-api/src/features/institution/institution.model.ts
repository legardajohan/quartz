import { Schema, model, Document } from 'mongoose';

// Interface for the EducationalInstitution document
export interface IInstitutionDocument extends Document {
  name: string;
  daneCode: string;
  address: string;
  rectorName: string;
  phoneNumber: string;
  email: string;
  isActive: boolean;
}

const InstitutionSchema = new Schema<IInstitutionDocument>(
  {
    name: { type: String, required: true },
    daneCode: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    rectorName: { type: String, required: true },
    phoneNumber: { type: String },
    email: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);

export const Institution = model<IInstitutionDocument>(
  'Institution',
  InstitutionSchema
);
