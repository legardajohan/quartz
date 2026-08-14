import { Types, Document } from 'mongoose';
import { StudentValuationModel, IStudentValuationDocument } from './student-valuation.model';
import { ChecklistTemplateModel } from '../checklist-template/checklist-template.model';
import { Period } from '../period/period.model';
import {
    findOneScoped,
    findScoped,
    createScoped,
    deleteOneScoped,
} from '../../repositories/base.repository';
import { validateAllExist } from '../../services/document-validator.service';
import {
  StudentValuationCreationData,
  StudentValuationUpdateData,
  StudentValuationConceptsUpdateData,
  IStudentValuationDTO,
  IValuationBySubjectDTO,
  GlobalValuationStatus,
  QualitativeValuation,
} from './student-valuation.types';
import AppError from '../../utils/AppError';
import { User } from '../auth/auth.model';
import { Subject } from '../subject/subject.model';
import { SubjectEvaluationMode } from '../subject/subject.types';
import { ConceptModel } from '../concept/concept.model';

// -----------------------------------------------------------------------------
// 0. DOMAIN RULES
// -----------------------------------------------------------------------------

/**
 * Umbrales de docs/domain.md §Concepto por dimensión: 80-100 Logrado · 46-79 En proceso · 0-45 Con dificultad.
 */
export function resolveQualitativeValuation(subjectPercentage: number): QualitativeValuation {
  if (subjectPercentage >= 80) return QualitativeValuation.ACHIEVED;
  if (subjectPercentage >= 46) return QualitativeValuation.IN_PROCESS;
  return QualitativeValuation.WITH_DIFICULTY;
}

// -----------------------------------------------------------------------------
// I. CENTRALIZED POPULATION AND DTO MAPPING (CORRECTED)
// -----------------------------------------------------------------------------

/**
 * Clean, explicit interfaces for the shape of the document AFTER population.
 * This avoids complex intersection/Omit types and provides clear guidance to TypeScript.
 */
interface PopulatedLearningValuation {
  _id: Types.ObjectId;
  learningDescription: string;
  qualitativeValuation: QualitativeValuation | null;
  pointsObtained: number;
}

interface PopulatedValuationBySubject {
  subjectId: { _id: Types.ObjectId; name: string } | null;
  evaluationMode: SubjectEvaluationMode;
  learningValuations: PopulatedLearningValuation[];
  performanceDescription: string | null;
  totalSubjectScore: number;
  maxSubjectScore: number;
  subjectPercentage: number;
  assignedConceptId?: Types.ObjectId;
  assignedConceptText?: string | null;
}

interface PopulatedValuationDoc extends Document {
  // Propiedades del Documento
  _id: Types.ObjectId;
  institutionId: Types.ObjectId;

  // Propiedades no pobladas de IStudentValuationDocument
  teacherId: Types.ObjectId;
  checklistTemplateId: Types.ObjectId;
  globalStatus: GlobalValuationStatus | null;
  observations: string | null;

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
  // Note: learningValuations are NOT populated because they are now embedded snapshots.
  const populatedDoc = (await valuationDoc.populate([
    { path: 'studentId', select: 'firstName middleName lastName secondLastName' },
    { path: 'periodId', select: 'name' },
    { path: 'valuationsBySubject.subjectId', select: 'name', model: Subject },
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

  const valuationsBySubject: IValuationBySubjectDTO[] = populatedDoc.valuationsBySubject.map(vs => {
    const base = {
      subjectId: vs.subjectId ? vs.subjectId._id.toString() : '',
      // Null safety: Provide a default value if the referenced subject is deleted.
      subjectName: vs.subjectId ? vs.subjectId.name : 'Asignatura no disponible',
      totalSubjectScore: vs.totalSubjectScore,
      maxSubjectScore: vs.maxSubjectScore,
      subjectPercentage: vs.subjectPercentage,
      assignedConceptId: vs.assignedConceptId?.toString(),
      assignedConceptText: vs.assignedConceptText ?? undefined,
    };

    if (vs.evaluationMode === SubjectEvaluationMode.DESCRIPTION) {
      return {
        ...base,
        evaluationMode: SubjectEvaluationMode.DESCRIPTION,
        learningValuations: [],
        performanceDescription: vs.performanceDescription,
      };
    }

    const learningValuations = vs.learningValuations.map(lv => ({
      // learningId in DTO now refers to the Valuation Item ID (subdocument ID) to allow targeting updates
      learningId: lv._id.toString(),
      learningDescription: lv.learningDescription,
      qualitativeValuation: lv.qualitativeValuation,
      pointsObtained: lv.pointsObtained,
    }));

    return {
      ...base,
      evaluationMode: SubjectEvaluationMode.CHECKLIST,
      learningValuations,
      performanceDescription: null,
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
    observations: populatedDoc.observations,
  };
}


// -----------------------------------------------------------------------------
// II. PUBLIC SERVICE METHODS (Refactored)
// -----------------------------------------------------------------------------

export async function getStudentValuationById(
  valuationId: string,
  institutionId: string
): Promise<IStudentValuationDTO> {
  const valuation = await findOneScoped(StudentValuationModel, institutionId, {
    _id: new Types.ObjectId(valuationId),
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
  const valuations = await findScoped(StudentValuationModel, institutionId, {
    studentId: new Types.ObjectId(studentId),
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
  const existingValuation = await findOneScoped(StudentValuationModel, institutionId, {
    studentId: new Types.ObjectId(studentId),
    periodId: new Types.ObjectId(periodId),
  });

  if (existingValuation) {
    // If it exists, populate and return it directly.
    return populateAndMapValuation(existingValuation);
  }

  // Validate that related documents exist before creation.
  try {
    await validateAllExist([[Period, periodId, 'Periodo'], [User, studentId, 'Estudiante']]);
  } catch (error: unknown) {
    throw new AppError(error instanceof Error ? error.message : 'Error desconocido', 404);
  }

  // Find the corresponding checklist template.
  const template = await findOneScoped(ChecklistTemplateModel, institutionId, {
    teacherId: new Types.ObjectId(teacherId),
    periodId: new Types.ObjectId(periodId),
  }).lean();

  if (!template) {
    throw new AppError('No existe una plantilla de lista de chequeo para este periodo. Por favor, cree una primero.', 404);
  }

  // Construct the initial valuation from the template.
  const valuationsBySubject = template.subjects.map(subject => {
    const isDescription = subject.subject.evaluationMode === SubjectEvaluationMode.DESCRIPTION;

    return {
      subjectId: subject.subject._id,
      evaluationMode: subject.subject.evaluationMode,
      maxSubjectScore: isDescription ? 0 : subject.learnings.length * 3,
      totalSubjectScore: 0,
      subjectPercentage: 0,
      performanceDescription: null,
      learningValuations: isDescription ? [] : subject.learnings.map(learningObj => ({
        learningDescription: learningObj.description,
        qualitativeValuation: null,
        pointsObtained: 0,
      })),
    };
  });

  const payload: StudentValuationCreationData = {
    institutionId: new Types.ObjectId(institutionId),
    studentId: new Types.ObjectId(studentId),
    teacherId: new Types.ObjectId(teacherId),
    checklistTemplateId: template._id,
    periodId: new Types.ObjectId(periodId),
    globalStatus: GlobalValuationStatus.CREATED,
    valuationsBySubject,
  };

  let valuationId: string;

  try {
    const newStudentValuation = await createScoped(StudentValuationModel, institutionId, payload);
    valuationId = newStudentValuation._id.toString();
  } catch (error: unknown) {
    // MongoServerError para race condition en creación concurrente; cast seguro porque re-lanzamos si no es duplicado
    const mongoError = error as { code?: number; codeName?: string };
    if (mongoError.code === 11000 || mongoError.codeName === 'DuplicateKey') {
      // Race condition handled
      const existing = await findOneScoped(StudentValuationModel, institutionId, {
        studentId: new Types.ObjectId(studentId),
        periodId: new Types.ObjectId(periodId),
      });
      if (!existing) throw error;
      valuationId = existing._id.toString();
    } else {
      throw error;
    }
  }

  // Return the fresh, fully populated document from the database
  return getStudentValuationById(valuationId, institutionId);
}


export async function updateStudentValuation(
  valuationId: string,
  institutionId: string,
  updateData: StudentValuationUpdateData
): Promise<IStudentValuationDTO> {
  const valuation = await findOneScoped(StudentValuationModel, institutionId, {
    _id: new Types.ObjectId(valuationId),
  });

  if (!valuation) {
    throw new AppError('Valoración no encontrada o no pertenece a la institución.', 404);
  }

  // Use a Map for efficient lookups of the updates.
  const updateMap = new Map(
    updateData.valuationsBySubject.map(subject => [
      subject.subjectId.toString(),
      // The keys here are the Valuation Item IDs (previously learningId in DTO)
      new Map(subject.learningValuations.map(lv => [lv.learningId.toString(), lv.qualitativeValuation])),
    ])
  );

  // Map of subjectId -> raw performanceDescription, only for subjects whose payload included it.
  const descriptionUpdateMap = new Map(
    updateData.valuationsBySubject
      .filter(subject => subject.performanceDescription !== undefined)
      .map(subject => [subject.subjectId.toString(), subject.performanceDescription ?? null])
  );

  // 1. Apply updates to the document from the payloads
  valuation.valuationsBySubject.forEach(subject => {
    const subjectUpdateMap = updateMap.get(subject.subjectId.toString());
    if (!subjectUpdateMap) return;

    subject.learningValuations.forEach(learningVal => {
      // With _id enabled, each learningVal has a unique ID.
      // We expect the DTO 'learningId' to match this _id.
      if (!learningVal._id) return;

      const valuationItemIdStr = learningVal._id.toString();
      if (subjectUpdateMap.has(valuationItemIdStr)) {
        learningVal.qualitativeValuation = subjectUpdateMap.get(valuationItemIdStr) ?? null;
      }
    });
  });

  // 2. Recalculate Global Status & Scores based on the FULL document state
  let totalLearnings = 0;
  let valuatedLearnings = 0;

  const pointsMapping = {
    [QualitativeValuation.ACHIEVED]: 3,
    [QualitativeValuation.IN_PROCESS]: 2,
    [QualitativeValuation.WITH_DIFICULTY]: 1
  };

  valuation.valuationsBySubject.forEach(subject => {
    let totalPoints = 0;

    subject.learningValuations.forEach(lv => {
      totalLearnings++;

      const points = lv.qualitativeValuation ? pointsMapping[lv.qualitativeValuation] : 0;
      lv.pointsObtained = points;
      totalPoints += points;

      if (lv.qualitativeValuation !== null) {
        valuatedLearnings++;
      }
    });

    // Update subject aggregates
    subject.totalSubjectScore = totalPoints;
    subject.subjectPercentage = subject.maxSubjectScore > 0
      ? (totalPoints / subject.maxSubjectScore) * 100
      : 0;

    // A dimension in description mode never earns points; it counts as one valuable unit,
    // valued when its performanceDescription is non-null.
    if (subject.evaluationMode === SubjectEvaluationMode.DESCRIPTION) {
      if (descriptionUpdateMap.has(subject.subjectId.toString())) {
        const rawDescription = descriptionUpdateMap.get(subject.subjectId.toString()) ?? '';
        const trimmedDescription = rawDescription?.trim() ?? '';
        subject.performanceDescription = trimmedDescription.length > 0 ? trimmedDescription : null;
      }

      totalLearnings++;
      if (subject.performanceDescription !== null) {
        valuatedLearnings++;
      }
    }
  });

  // 3. Assign the default Concept for each fully-valued checklist subject, by qualitative level.
  const periodConcepts = await findScoped(ConceptModel, institutionId, {
    periodId: valuation.periodId,
  })
    .select('subjectId valuationType createdAt description')
    .sort({ createdAt: 1 })
    .lean();

  const conceptCandidatesByKey = new Map<string, { id: string; description: string }[]>();
  periodConcepts.forEach(concept => {
    const key = `${concept.subjectId.toString()}|${concept.valuationType}`;
    const candidate = { id: concept._id.toString(), description: concept.description };
    const candidates = conceptCandidatesByKey.get(key);
    if (candidates) {
      candidates.push(candidate);
    } else {
      conceptCandidatesByKey.set(key, [candidate]);
    }
  });

  valuation.valuationsBySubject.forEach(subject => {
    if (subject.evaluationMode !== SubjectEvaluationMode.CHECKLIST) return;

    const isFullyValued = subject.learningValuations.length > 0
      && subject.learningValuations.every(lv => lv.qualitativeValuation !== null);

    if (!isFullyValued) {
      subject.assignedConceptId = undefined;
      subject.assignedConceptText = undefined;
      return;
    }

    const level = resolveQualitativeValuation(subject.subjectPercentage);
    const candidates = conceptCandidatesByKey.get(`${subject.subjectId.toString()}|${level}`) ?? [];
    const currentConceptId = subject.assignedConceptId?.toString();

    if (currentConceptId && candidates.some(c => c.id === currentConceptId)) return;

    const chosen = candidates[0];
    subject.assignedConceptId = chosen ? new Types.ObjectId(chosen.id) : undefined;
    subject.assignedConceptText = chosen ? chosen.description : undefined;
  });

  // 4. Persist optional free-text observations, normalizing blank input to null.
  if (updateData.observations !== undefined) {
    const trimmedObservations = updateData.observations?.trim() ?? '';
    valuation.observations = trimmedObservations.length > 0 ? trimmedObservations : null;
  }

  // 5. Determine Global Status
  if (valuatedLearnings === 0) {
    valuation.globalStatus = GlobalValuationStatus.CREATED;
  } else if (valuatedLearnings === totalLearnings && totalLearnings > 0) {
    valuation.globalStatus = GlobalValuationStatus.COMPLETED;
  } else {
    valuation.globalStatus = GlobalValuationStatus.IN_PROGRESS;
  }

  await valuation.save();

  // Directly populate and map the updated document without a second DB query.
  return populateAndMapValuation(valuation);
}

export async function updateValuationConcepts(
  valuationId: string,
  institutionId: string,
  data: StudentValuationConceptsUpdateData
): Promise<IStudentValuationDTO> {
  const valuation = await findOneScoped(StudentValuationModel, institutionId, {
    _id: new Types.ObjectId(valuationId),
  });

  if (!valuation) {
    throw new AppError('Valoración no encontrada o no pertenece a la institución.', 404);
  }

  if (valuation.globalStatus !== GlobalValuationStatus.COMPLETED) {
    throw new AppError('La Lista de Chequeo aún no está evaluada completamente.', 409);
  }

  const conceptIds = data.assignments.map(assignment => new Types.ObjectId(assignment.conceptId));
  const concepts = await findScoped(ConceptModel, institutionId, {
    _id: { $in: conceptIds },
  })
    .select('subjectId periodId valuationType')
    .lean();

  const conceptsById = new Map(concepts.map(concept => [concept._id.toString(), concept]));

  // Validate every assignment before mutating the document, so a single invalid entry aborts the whole request.
  data.assignments.forEach(assignment => {
    const subject = valuation.valuationsBySubject.find(
      s => s.subjectId.toString() === assignment.subjectId
    );

    if (!subject || subject.evaluationMode !== SubjectEvaluationMode.CHECKLIST) {
      throw new AppError('La dimensión no existe en esta valoración o no admite conceptos.', 422);
    }

    const concept = conceptsById.get(assignment.conceptId);
    if (!concept) {
      throw new AppError('El concepto no existe o no pertenece a la institución.', 422);
    }

    const level = resolveQualitativeValuation(subject.subjectPercentage);
    const matchesSubject = concept.subjectId.toString() === assignment.subjectId;
    const matchesPeriod = concept.periodId.toString() === valuation.periodId.toString();
    const matchesLevel = concept.valuationType === level;

    if (!matchesSubject || !matchesPeriod || !matchesLevel) {
      throw new AppError('El concepto no corresponde a la dimensión, el período o el nivel obtenido.', 422);
    }
  });

  data.assignments.forEach(assignment => {
    const subject = valuation.valuationsBySubject.find(
      s => s.subjectId.toString() === assignment.subjectId
    );
    if (subject) {
      subject.assignedConceptId = new Types.ObjectId(assignment.conceptId);
      subject.assignedConceptText = assignment.conceptText;
    }
  });

  await valuation.save();

  return populateAndMapValuation(valuation);
}

export async function deleteStudentValuation(valuationId: string, institutionId: string): Promise<void> {
  const { deletedCount } = await deleteOneScoped(StudentValuationModel, institutionId, {
    _id: new Types.ObjectId(valuationId),
  });

  if (deletedCount === 0) {
    throw new AppError('Valoración no encontrada o no pertenece a la institución.', 404);
  }
}
