import { Schema, model, Document, Types } from 'mongoose';
import { IChecklistTemplate } from './checklist-template.types';

export interface IChecklistTemplateDocument extends IChecklistTemplate, Document {
  _id: Types.ObjectId; 
}

const subjectInTemplateSchema = new Schema({
  subjectId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Subject', 
    required: true 
  },
  learnings: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Learning', 
    required: true 
  }]
}, { _id: false }); // _id is not needed for this subdocument

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