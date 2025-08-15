import { Schema, model, Document } from 'mongoose';

export interface IPeriodDocument extends Document {
    institutionId: Schema.Types.ObjectId;
    name: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
};

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