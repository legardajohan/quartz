import { Schema, model, Document } from 'mongoose';
import { LeanDocument } from '../../types/mongoose';

export interface ISubject {
    institutionId: Schema.Types.ObjectId;
    name: string;
    type: 'Dimensión' | 'Asignatura';
};

export interface ISubjectDocument extends ISubject, Document {};

export type PlainSubjectObject = LeanDocument<ISubject>;

const SubjectSchema = new Schema<ISubjectDocument>({
    institutionId: { type: Schema.Types.ObjectId, ref: 'EducationalInstitution' },
    name: { type: String, required: true },
    type: { type: String, enum: ['Dimensión', 'Asignatura'], required: true }
}, {
    timestamps: true
});

export const Subject = model<ISubjectDocument>('Subject', SubjectSchema);