import { Schema, model, Document, Types } from 'mongoose';

export interface ISchool {
    _id: string;
    institutionId: string;
    schoolNumber: number;
    name: string;
}

export interface ISchoolDocument extends Document {
    _id: Types.ObjectId;
    institutionId: Types.ObjectId;
    schoolNumber: number;
    name: string;
}

const schoolSchema = new Schema<ISchoolDocument>({
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true },
    schoolNumber: { type: Number, required: true },
    name: { type: String, required: true },
}, { timestamps: true });

export const SchoolModel = model<ISchoolDocument>('School', schoolSchema);