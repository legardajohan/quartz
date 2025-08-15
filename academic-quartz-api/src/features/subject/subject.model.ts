import { Schema, model, Document } from 'mongoose';

export interface ISubjectDocument extends Document {
    institutionId: Schema.Types.ObjectId;
    name: string;
    type: 'Dimensión' | 'Asignatura';
};

const SubjectSchema = new Schema<ISubjectDocument>({
    institutionId: { type: Schema.Types.ObjectId, ref: 'EducationalInstitution', required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['Dimensión', 'Asignatura'], required: true }
}, {
    timestamps: true
});

export const Subject = model<ISubjectDocument>('Subject', SubjectSchema);