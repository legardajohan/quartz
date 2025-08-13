import { Schema, model, Document } from 'mongoose';

// Interface for the EducationalInstitution document
export interface IEducationalInstitution extends Document {
  name: string;
  daneCode: string;
  address: string;
  rectorName: string;
  phoneNumber: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
}

const EducationalInstitutionSchema = new Schema<IEducationalInstitution>(
  {
    name: { type: String, required: true },
    daneCode: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    rectorName: { type: String, required: true },
    phoneNumber: { type: String },
    email: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);

export const EducationalInstitution = model<IEducationalInstitution>(
  'EducationalInstitution',
  EducationalInstitutionSchema
);
