import { Schema, model, Document, Types } from 'mongoose';

// Interface for the nested LearningValuation
export interface ILearningValuation {
  learningId: Types.ObjectId;
  qualitativeValuation: 'Logrado' | 'En proceso' | 'Con dificultad' | null;
  pointsObtained: number;
}

// Interface for the nested ValuationBySubject
export interface IValuationBySubject {
  subjectId: Types.ObjectId;
  learningValuations: ILearningValuation[];
  totalSubjectScore: number;
  maxSubjectScore: number;
  subjectPercentage: number;
  assignedConceptId?: Types.ObjectId;
}

// Interface for the StudentValuation document
export interface IStudentValuationDocument extends Document {
  institutionId: Types.ObjectId;
  studentId: Types.ObjectId;
  teacherId: Types.ObjectId;
  checklistTemplateId: Types.ObjectId;
  periodId: Types.ObjectId;
  globalStatus: 'Completado' | 'En desarrollo' | 'No iniciado';
  valuationsBySubject: IValuationBySubject[];
}

const learningValuationSchema = new Schema<ILearningValuation>({
  learningId: { type: Schema.Types.ObjectId, ref: 'Learning', required: true },
  qualitativeValuation: { type: String, enum: ['Logrado', 'En proceso', 'Con dificultad', null], default: null },
  pointsObtained: { type: Number, default: 0 }
}, { _id: false });

const valuationBySubjectSchema = new Schema<IValuationBySubject>({
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  learningValuations: [learningValuationSchema],
  totalSubjectScore: { type: Number, default: 0 },
  maxSubjectScore: { type: Number, default: 0 },
  subjectPercentage: { type: Number, default: 0 },
  assignedConceptId: { type: Schema.Types.ObjectId, ref: 'Concept' }
}, { _id: false });

const studentValuationSchema = new Schema<IStudentValuationDocument>({
  institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  checklistTemplateId: { type: Schema.Types.ObjectId, ref: 'ChecklistTemplate', required: true },
  periodId: { type: Schema.Types.ObjectId, ref: 'Period', required: true },
  globalStatus: { type: String, enum: ['Valorado', 'Valorando', 'No iniciado'], default: 'No iniciado', index: true },
  valuationsBySubject: [valuationBySubjectSchema]
}, {
  timestamps: true,
});

// Compound unique index to ensure one valuation per student per period
studentValuationSchema.index({ studentId: 1, periodId: 1 }, { unique: true });

export const StudentValuationModel = model<IStudentValuationDocument>('StudentValuation', studentValuationSchema, 'studentValuations');
