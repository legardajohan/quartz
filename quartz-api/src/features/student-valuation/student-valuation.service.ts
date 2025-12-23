import { Types, Document } from 'mongoose';
import { StudentValuationModel, IStudentValuationDocument } from './student-valuation.model';
import { ChecklistTemplateModel } from '../checklist-template/checklist-template.model';
import { Period } from '../period/period.model';
import { create } from '../../repositories/base.repository';
import { validateAllExist } from '../../services/document-validator.service';
import {
  StudentValuationCreationData,
  StudentValuationUpdateData,
  IStudentValuationDTO,
  GlobalValuationStatus,
  QualitativeValuation,
} from './student-valuation.types';
import AppError from '../../utils/AppError';
import { User } from '../auth/auth.model';
import { Subject } from '../subject/subject.model';
import { LearningModel } from '../learning/learning.model';

// -----------------------------------------------------------------------------
// I. CENTRALIZED POPULATION AND DTO MAPPING (CORRECTED)
// -----------------------------------------------------------------------------

/**
 * Clean, explicit interfaces for the shape of the document AFTER population.
 * This avoids complex intersection/Omit types and provides clear guidance to TypeScript.
 */
interface PopulatedLearningValuation {
  learningId: { _id: Types.ObjectId; description: string } | null;
  qualitativeValuation: QualitativeValuation | null;
  pointsObtained: number;
}

interface PopulatedValuationBySubject {
  subjectId: { _id: Types.ObjectId; name: string } | null;
  learningValuations: PopulatedLearningValuation[];
  totalSubjectScore: number;
  maxSubjectScore: number;
  subjectPercentage: number;
  assignedConceptId?: Types.ObjectId;
}

interface PopulatedValuationDoc extends Document {
  // Propiedades del Documento
  _id: Types.ObjectId;
  institutionId: Types.ObjectId;

  // Propiedades no pobladas de IStudentValuationDocument
  teacherId: Types.ObjectId;
  checklistTemplateId: Types.ObjectId;
  globalStatus: GlobalValuationStatus | null;

  // Propiedades que ahora están pobladas (con su nuevo tipo)
  studentId: {
    _id: Types.ObjectId;
    firstName: string;
    middleName?: string;
    lastName: string;
    secondLastName?: string;
  } | null;
  periodId: { _id: Types.ObjectId; name: string } | null;
  valuationsBySubject: PopulatedValuationBySubject[];
}

/**
 * Centralized function to enrich a StudentValuation document with related data.
 * It takes a Mongoose document, populates it, and maps it to the final DTO.
 * This function is the single source of truth for data enrichment.
 * @param valuationDoc A Mongoose document instance of a student valuation.
 * @returns {Promise<IStudentValuationDTO>} A promise that resolves to the enriched DTO.
 */
async function populateAndMapValuation(valuationDoc: IStudentValuationDocument): Promise<IStudentValuationDTO> {
  // 1. Populate all required fields in a single database query.
  const populatedDoc = (await valuationDoc.populate([
    { path: 'studentId', select: 'firstName middleName lastName secondLastName' },
    { path: 'periodId', select: 'name' },
    { path: 'valuationsBySubject.subjectId', select: 'name', model: Subject },
    { path: 'valuationsBySubject.learningValuations.learningId', select: 'description', model: LearningModel },
  ])) as PopulatedValuationDoc; // Explicitly cast to our clean, populated type.

  // 2. Map the populated document to the target DTO, handling potential nulls.
  if (!populatedDoc.studentId) {
    // This is a critical data integrity issue. A valuation must always have a student.
    throw new AppError('Error de integridad de datos: El estudiante asociado a esta valoración no fue encontrado.', 500);
  }

  const studentName = {
    firstName: populatedDoc.studentId.firstName,
    middleName: populatedDoc.studentId.middleName,
    lastName: populatedDoc.studentId.lastName,
    secondLastName: populatedDoc.studentId.secondLastName,
  };

  const valuationsBySubject = populatedDoc.valuationsBySubject.map(vs => {
    const learningValuations = vs.learningValuations.map(lv => ({
      learningId: lv.learningId ? lv.learningId._id.toString() : '',
      // Null safety: Provide a default value if the referenced learning is deleted.
      learningDescription: lv.learningId ? lv.learningId.description : 'Aprendizaje eliminado',
      qualitativeValuation: lv.qualitativeValuation,
      pointsObtained: lv.pointsObtained,
    }));

    return {
      subjectId: vs.subjectId ? vs.subjectId._id.toString() : '',
      // Null safety: Provide a default value if the referenced subject is deleted.
      subjectName: vs.subjectId ? vs.subjectId.name : 'Asignatura no disponible',
      totalSubjectScore: vs.totalSubjectScore,
      maxSubjectScore: vs.maxSubjectScore,
      subjectPercentage: vs.subjectPercentage,
      assignedConceptId: vs.assignedConceptId?.toString(),
      learningValuations,
    };
  });
  
  // 3. Construct and return the final DTO.
  return {
    _id: populatedDoc._id.toString(),
    institutionId: populatedDoc.institutionId.toString(),
    studentId: populatedDoc.studentId._id.toString(),
    studentName,
    teacherId: populatedDoc.teacherId.toString(),
    checklistTemplateId: populatedDoc.checklistTemplateId.toString(),
    periodId: populatedDoc.periodId ? populatedDoc.periodId._id.toString() : '',
    // Null safety: Provide a default value if the referenced period is deleted.
    periodName: populatedDoc.periodId ? populatedDoc.periodId.name : 'Periodo no disponible',
    globalStatus: populatedDoc.globalStatus,
    valuationsBySubject,
  };
}


// -----------------------------------------------------------------------------
// II. PUBLIC SERVICE METHODS (Refactored)
// -----------------------------------------------------------------------------

export async function getStudentValuationById(
  valuationId: string,
  institutionId: string
): Promise<IStudentValuationDTO> {
  const valuation = await StudentValuationModel.findOne({
    _id: new Types.ObjectId(valuationId),
    institutionId: new Types.ObjectId(institutionId),
  });

  if (!valuation) {
    throw new AppError('Valoración no encontrada o no pertenece a la institución.', 404);
  }

  return populateAndMapValuation(valuation);
}

export async function getStudentValuations(
  studentId: string,
  institutionId: string
): Promise<IStudentValuationDTO[]> {
  const valuations = await StudentValuationModel.find({
    studentId: new Types.ObjectId(studentId),
    institutionId: new Types.ObjectId(institutionId),
  });

  // Map each document to its populated DTO, running population in parallel.
  return Promise.all(valuations.map(v => populateAndMapValuation(v)));
}

export async function initializeStudentValuation(
  studentId: string,
  teacherId: string,
  institutionId: string,
  periodId: string
): Promise<IStudentValuationDTO> {
  // Check if a valuation already exists to avoid duplication.
  const existingValuation = await StudentValuationModel.findOne({
    studentId: new Types.ObjectId(studentId),
    periodId: new Types.ObjectId(periodId),
    institutionId: new Types.ObjectId(institutionId),
  });

  if (existingValuation) {
    // If it exists, populate and return it directly.
    return populateAndMapValuation(existingValuation);
  }

  // Validate that related documents exist before creation.
  await validateAllExist([[Period, periodId, 'Periodo'], [User, studentId, 'Estudiante']]);

  // Find the corresponding checklist template.
  const template = await ChecklistTemplateModel.findOne({
    teacherId: new Types.ObjectId(teacherId),
    periodId: new Types.ObjectId(periodId),
    institutionId: new Types.ObjectId(institutionId), // CRITICAL: Added institutionId filter
  }).lean(); // .lean() is fine here as we only need the data to construct the new valuation.

  if (!template) {
    throw new AppError('No existe una plantilla de lista de chequeo para este periodo. Por favor, cree una primero.', 404);
  }
  
  // Construct the initial valuation from the template.
  const valuationsBySubject = template.subjects.map(subject => ({
    subjectId: subject.subjectId,
    maxSubjectScore: subject.learnings.length * 3, // Assuming max points per learning is 3
    totalSubjectScore: 0,
    subjectPercentage: 0,
    learningValuations: subject.learnings.map(learning => ({
      learningId: (learning as unknown as {_id: Types.ObjectId})._id,
      qualitativeValuation: null,
      pointsObtained: 0,
    })),
  }));

  const payload: StudentValuationCreationData = {
    institutionId: new Types.ObjectId(institutionId),
    studentId: new Types.ObjectId(studentId),
    teacherId: new Types.ObjectId(teacherId),
    checklistTemplateId: template._id,
    periodId: new Types.ObjectId(periodId),
    globalStatus: GlobalValuationStatus.CREATED,
    valuationsBySubject,
  };

  const newStudentValuation = await create(StudentValuationModel, payload);
  
  // Directly populate and map the newly created document without a second DB query.
  return populateAndMapValuation(newStudentValuation);
}


export async function updateStudentValuation(
  valuationId: string,
  institutionId: string,
  updateData: StudentValuationUpdateData
): Promise<IStudentValuationDTO> {
  const valuation = await StudentValuationModel.findOne({
    _id: new Types.ObjectId(valuationId),
    institutionId: new Types.ObjectId(institutionId)
  });

  if (!valuation) {
    throw new AppError('Valoración no encontrada o no pertenece a la institución.', 404);
  }

  // Use a Map for efficient lookups of the updates.
  const updateMap = new Map(
    updateData.valuationsBySubject.map(subject => [
      subject.subjectId.toString(),
      new Map(subject.learningValuations.map(lv => [lv.learningId.toString(), lv.qualitativeValuation])),
    ])
  );

  let isComplete = true;

  // Apply updates to the document.
  valuation.valuationsBySubject.forEach(subject => {
    const subjectUpdateMap = updateMap.get(subject.subjectId.toString());
    if (!subjectUpdateMap) return;

    subject.learningValuations.forEach(learningVal => {
      const learningIdStr = learningVal.learningId.toString();
      if (subjectUpdateMap.has(learningIdStr)) {
        learningVal.qualitativeValuation = subjectUpdateMap.get(learningIdStr) ?? null;
      }
      if (learningVal.qualitativeValuation === null) {
        isComplete = false;
      }
    });
  });
  
  // Update status and calculate scores if the valuation is complete.
  if (isComplete) {
    valuation.globalStatus = GlobalValuationStatus.COMPLETED;
    const pointsMapping = {
      [QualitativeValuation.ACHIEVED]: 3,
      [QualitativeValuation.IN_PROCESS]: 2,
      [QualitativeValuation.WITH_DIFICULTY]: 1
    };

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
    });
  } else {
    valuation.globalStatus = GlobalValuationStatus.IN_PROGRESS;
  }

  await valuation.save();
  
  // Directly populate and map the updated document without a second DB query.
  return populateAndMapValuation(valuation);
}

export async function deleteStudentValuation(valuationId: string, institutionId: string): Promise<void> {
  const { deletedCount } = await StudentValuationModel.deleteOne({
    _id: new Types.ObjectId(valuationId),
    institutionId: new Types.ObjectId(institutionId),
  });

  if (deletedCount === 0) {
    throw new AppError('Valoración no encontrada o no pertenece a la institución.', 404);
  }
}
