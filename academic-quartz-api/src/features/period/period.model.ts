import { Schema, model, Document } from 'mongoose';
import { LeanDocument } from '../../types/mongoose';

export interface IPeriod {
    institutionId: Schema.Types.ObjectId;
    name: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
};

export interface IPeriodDocument extends IPeriod, Document {};

export type PlainPeriodObject = LeanDocument<IPeriod>;

const PeriodSchema = new Schema<IPeriodDocument>({
    institutionId: { type: Schema.Types.ObjectId, ref: 'EducationalInstitution', required: true },
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

export const Period = model<IPeriodDocument>('Period', PeriodSchema);