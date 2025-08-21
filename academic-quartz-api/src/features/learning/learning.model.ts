import { Schema, model, Document } from 'mongoose';

export interface ILearningDocument extends Document {
  institutionId: Schema.Types.ObjectId;
  subjectId: Schema.Types.ObjectId; 
  periodId: Schema.Types.ObjectId;
  description: string;
  grade: string;
};

const LearningSchema = new Schema<ILearningDocument>({
  institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  periodId: { type: Schema.Types.ObjectId, ref: 'Period', required: true },
  description: { type: String, required: true },
  grade: { type: String, required: true }
}, {
  timestamps: true
});

export const Learning = model<ILearningDocument>('Learning', LearningSchema);