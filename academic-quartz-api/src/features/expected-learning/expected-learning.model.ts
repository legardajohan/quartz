import { Schema, model, Document } from 'mongoose';

export interface IExpectedLearningDocument extends Document {
  institutionId: Schema.Types.ObjectId;
  subjectId: Schema.Types.ObjectId; 
  periodId: Schema.Types.ObjectId;
  description: string;
  grade: string;
};

const ExpectedLearningSchema = new Schema<IExpectedLearningDocument>({
  institutionId: { type: Schema.Types.ObjectId, ref: 'EducationalInstitution', required: true },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  periodId: { type: Schema.Types.ObjectId, ref: 'Period', required: true },
  description: { type: String, required: true },
  grade: { type: String, required: true }
}, {
  timestamps: true
});

export const ExpectedLearning = model<IExpectedLearningDocument>('ExpectedLearning', ExpectedLearningSchema);