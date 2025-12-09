import { Types } from 'mongoose';
import { StudentValuationModel, IStudentValuationDocument } from './student-valuation.model';
import { ChecklistTemplateModel } from '../checklist-template/checklist-template.model';
import { Period } from '../period/period.model';
import { create } from '../../repositories/base.repository';
import { validateAllExist } from '../../services/document-validator.service';
import { StudentValuationCreationData, StudentValuationUpdateData } from './student-valuation.types';
import AppError from '../../utils/AppError';

export async function initializeStudentValuation(
    studentId: string,
    teacherId: string,
    institutionId: string,
    periodId: string
  ): Promise<IStudentValuationDocument> {
    
    // 1. Check if a valuation already exists. Use institutionId for security.
    const existingValuation = await StudentValuationModel.findOne({
      studentId: new Types.ObjectId(studentId),
      periodId: new Types.ObjectId(periodId),
      institutionId: new Types.ObjectId(institutionId),
    });

    if (existingValuation) {
      return existingValuation;
    }

    // 2. If not, validate dependencies before creating a new one.
    await validateAllExist([
        [Period, periodId, 'Period'],
    ]);

    // 3. Find the teacher's checklist template for the period. Use .lean() for performance.
    const template = await ChecklistTemplateModel.findOne({
      teacherId: new Types.ObjectId(teacherId),
      periodId: new Types.ObjectId(periodId),
      institutionId: new Types.ObjectId(institutionId),
    })
    .populate({
      path: 'subjects.learnings',
      select: '_id'
    })
    .lean();

    if (!template) {
      throw new Error('No existe una plantilla de lista de chequeo para este periodo. Por favor, cree una primero.');
    }

    // 4. Construct the new StudentValuation document payload with a strong type
    const payload: StudentValuationCreationData = {
      institutionId: new Types.ObjectId(institutionId),
      studentId: new Types.ObjectId(studentId),
      teacherId: new Types.ObjectId(teacherId),
      checklistTemplateId: template._id,
      periodId: new Types.ObjectId(periodId),
      globalStatus: 'En desarrollo',
      valuationsBySubject: template.subjects.map(subjectInTemplate => ({
        subjectId: subjectInTemplate.subjectId,
        maxSubjectScore: (subjectInTemplate.learnings || []).length * 3,
        totalSubjectScore: 0,
        subjectPercentage: 0,
        learningValuations: (subjectInTemplate.learnings || []).map(learning => ({
          learningId: (learning as any)._id,
          qualitativeValuation: null,
          pointsObtained: 0,
        })),
      })),
    };
    
    // 5. Create document using the base repository
    const newStudentValuation = await create(StudentValuationModel, payload);

    return newStudentValuation;
  }


export async function updateStudentValuation(
  valuationId: string,
  institutionId: string,
  updateData: StudentValuationUpdateData
): Promise<IStudentValuationDocument> {
  
  const valuation = await StudentValuationModel.findOne({
    _id: new Types.ObjectId(valuationId),
    institutionId: new Types.ObjectId(institutionId)
  });

  if (!valuation) {
    throw new AppError('Valoración no encontrada o no pertenece a la institución.', 404);
  }

  // Create a map for efficient lookups of the incoming data
  const updateMap = new Map(
    updateData.valuationsBySubject.map(subject => [
      subject.subjectId.toString(),
      new Map(subject.learningValuations.map(lv => [lv.learningId.toString(), lv.qualitativeValuation])),
    ])
  );

  let isComplete = true;

  // Update valuations and check for completeness
  valuation.valuationsBySubject.forEach(subject => {
    const subjectUpdateMap = updateMap.get(subject.subjectId.toString());
    if (!subjectUpdateMap) return;

    subject.learningValuations.forEach(learningVal => {
      const learningIdStr = learningVal.learningId.toString();
      if (subjectUpdateMap.has(learningIdStr)) {
        learningVal.qualitativeValuation = subjectUpdateMap.get(learningIdStr) ?? null;
      }
      // After attempting update, check if it's still null
      if (learningVal.qualitativeValuation === null) {
        isComplete = false;
      }
    });
  });

  if (isComplete) {
    valuation.globalStatus = 'Completado';
    const pointsMapping = { 'Logrado': 3, 'En proceso': 2, 'Con dificultad': 1 };

    valuation.valuationsBySubject.forEach(subject => {
      let totalPoints = 0;
      subject.learningValuations.forEach(lv => {
        const points = lv.qualitativeValuation ? pointsMapping[lv.qualitativeValuation] : 0;
        lv.pointsObtained = points;
        totalPoints += points;
      });

      subject.totalSubjectScore = totalPoints;
      subject.subjectPercentage = subject.maxSubjectScore > 0 
        ? (totalPoints / subject.maxSubjectScore) * 100 
        : 0;

      // TODO: Implement logic to find and assign `assignedConceptId` once the Concept feature is available.
      // Example:
      // const conceptName = getConceptNameForPercentage(subject.subjectPercentage);
      // const concept = await ConceptModel.findOne({ name: conceptName, institutionId });
      // if (concept) subject.assignedConceptId = concept._id;
    });

  } else {
    valuation.globalStatus = 'En desarrollo';
  }

  await valuation.save();
  return valuation;
}