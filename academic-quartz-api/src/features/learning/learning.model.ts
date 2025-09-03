import { Schema, model, Document, Types } from 'mongoose';

export interface ILearning {
  institutionId: string;
  subjectId: string;
  periodId: string;
  description: string;
  grade: string;
}

export interface ILearningDocument extends Document {
  institutionId: Types.ObjectId;
  subjectId: Types.ObjectId; 
  periodId: Types.ObjectId;
  description: string;
  grade: string;
}

const LearningSchema = new Schema<ILearningDocument>({
  institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  periodId: { type: Schema.Types.ObjectId, ref: 'Period', required: true },
  description: { type: String, required: true },
  grade: { type: String, required: true }
}, {
  timestamps: true
});

export const LearningModel = model<ILearningDocument>('Learning', LearningSchema);