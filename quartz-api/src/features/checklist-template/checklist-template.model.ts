import { Schema, model, Document, Types } from 'mongoose';
import { IChecklistTemplate } from './checklist-template.types';

export interface IChecklistTemplateDocument extends IChecklistTemplate, Document {
  _id: Types.ObjectId;
}

const learningSchema = new Schema({
  description: { type: String, required: true }
}); // _id is enabled by default

const subjectInTemplateSchema = new Schema({
  subject: {
    _id: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true }
  },
  learnings: [learningSchema]
}, { _id: false }); // _id is not needed for the subject wrapper, but learnings WILL have _id by default

const ChecklistTemplateSchema = new Schema<IChecklistTemplateDocument>({
  institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true },
  periodId: { type: Schema.Types.ObjectId, ref: 'Period', required: true },
  teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  subjects: [subjectInTemplateSchema]
}, {
  timestamps: true
});

export const ChecklistTemplateModel = model<IChecklistTemplateDocument>('ChecklistTemplate', ChecklistTemplateSchema, 'checklistTemplates');