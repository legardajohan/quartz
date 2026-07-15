import { Schema, model, Document, Types } from 'mongoose';
import { IChecklistTemplate } from './checklist-template.types';
import { SubjectEvaluationMode } from '../subject/subject.types';

export interface IChecklistTemplateDocument extends IChecklistTemplate, Document {
  _id: Types.ObjectId;
}

const learningSchema = new Schema({
  description: { type: String, required: true }
});

const subjectInTemplateSchema = new Schema({
  subject: {
    _id: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    evaluationMode: { type: String, enum: Object.values(SubjectEvaluationMode), required: true }
  },
  learnings: [learningSchema]
}, { _id: false });

const ChecklistTemplateSchema = new Schema<IChecklistTemplateDocument>({
  institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true },
  periodId: { type: Schema.Types.ObjectId, ref: 'Period', required: true },
  teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  grade: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  subjects: [subjectInTemplateSchema]
}, {
  timestamps: true
});

ChecklistTemplateSchema.index({ institutionId: 1 });

export const ChecklistTemplateModel = model<IChecklistTemplateDocument>(
  'ChecklistTemplate',
  ChecklistTemplateSchema,
  'checklistTemplates'
);
