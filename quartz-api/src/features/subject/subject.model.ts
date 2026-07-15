import { Schema, model, Document } from 'mongoose';
import { LeanDocument } from '../../types/mongoose';
import { SubjectType, SubjectEvaluationMode } from './subject.types';

export interface ISubject {
    institutionId: Schema.Types.ObjectId;
    name: string;
    type: SubjectType;
    evaluationMode: SubjectEvaluationMode;
};

export interface ISubjectDocument extends ISubject, Document {};

export type PlainSubjectObject = LeanDocument<ISubject>;

const SubjectSchema = new Schema<ISubjectDocument>({
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: Object.values(SubjectType), required: true },
    evaluationMode: { type: String, enum: Object.values(SubjectEvaluationMode), default: SubjectEvaluationMode.CHECKLIST }
}, {
    timestamps: true
});

SubjectSchema.index({ institutionId: 1, name: 1 }, { unique: true });

export const Subject = model<ISubjectDocument>('Subject', SubjectSchema);
