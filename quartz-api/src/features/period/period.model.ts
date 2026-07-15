import { Schema, model, Document } from 'mongoose';
import { LeanDocument } from '../../types/mongoose';

export interface IPeriod {
    institutionId: Schema.Types.ObjectId;
    name: string;
    year: number;
    startDate: Date;
    endDate: Date;
    closingAlertDate: Date | null;
    isActive: boolean;
};

export interface IPeriodDocument extends IPeriod, Document {};

export type PlainPeriodObject = LeanDocument<IPeriod>;

const PeriodSchema = new Schema<IPeriodDocument>({
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    name: { type: String, required: true },
    year: { type: Number, required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    closingAlertDate: { type: Date, default: null },
    isActive: { type: Boolean, default: false }
}, {
    timestamps: true
});

PeriodSchema.index(
    { institutionId: 1, isActive: 1 },
    { unique: true, partialFilterExpression: { isActive: true } }
);

export const Period = model<IPeriodDocument>('Period', PeriodSchema);
