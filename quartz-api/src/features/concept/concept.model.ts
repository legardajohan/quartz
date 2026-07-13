import { Schema, model, Document, Types } from 'mongoose';
import { IConcept, QualitativeValuation } from './concept.types';

export interface IConceptDocument extends IConcept, Document {
  _id: Types.ObjectId;
}

const ConceptSchema = new Schema<IConceptDocument>({
  institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true },
  description: { type: String, required: true, trim: true },
  valuationType: { type: String, enum: Object.values(QualitativeValuation), required: true },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  periodId: { type: Schema.Types.ObjectId, ref: 'Period', required: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true
});

ConceptSchema.index({ institutionId: 1 });

export const ConceptModel = model<IConceptDocument>('Concept', ConceptSchema);
