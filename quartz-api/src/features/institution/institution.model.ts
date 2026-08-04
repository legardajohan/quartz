import { Schema, model, Document } from 'mongoose';
import { ReportKind, IInstitutionSettings } from './institution.types';

// Interface for the EducationalInstitution document
export interface IInstitutionDocument extends Document {
  name: string;
  daneCode: string;
  address: string;
  rectorName: string;
  phoneNumber: string;
  email: string;
  isActive: boolean;
  settings: IInstitutionSettings;
  shieldUrl?: string; // .webp — consumido por las vistas de la app (Configuración, PDF nunca lo lee directo)
  shieldJpgUrl?: string; // .jpg — precomputado al subir el escudo; solo lo consume el proxy de imagen del informe PDF
}

const InstitutionSettingsSchema = new Schema<IInstitutionSettings>(
  {
    enabledReports: {
      type: [String],
      enum: Object.values(ReportKind),
      default: [ReportKind.CHECKLIST, ReportKind.COMMUNICATIVE_LETTER],
    },
  },
  { _id: false }
);

const InstitutionSchema = new Schema<IInstitutionDocument>(
  {
    name: { type: String, required: true },
    daneCode: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    rectorName: { type: String, required: true },
    phoneNumber: { type: String },
    email: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    settings: { type: InstitutionSettingsSchema, default: () => ({}) },
    shieldUrl: { type: String }, // .webp — vistas de la app
    shieldJpgUrl: { type: String }, // .jpg — proxy de imagen del informe PDF (@react-pdf/renderer no decodifica webp)
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);

export const Institution = model<IInstitutionDocument>(
  'Institution',
  InstitutionSchema
);
