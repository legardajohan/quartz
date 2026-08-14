import { Types } from 'mongoose';
import { getStudentValuationById, resolveQualitativeValuation } from '../student-valuation/student-valuation.service';
import { GlobalValuationStatus, QualitativeValuation, IStudentValuationDTO } from '../student-valuation/student-valuation.types';
import { ChecklistTemplateModel } from '../checklist-template/checklist-template.model';
import { User } from '../auth/auth.model';
import { UserRole } from '../auth/auth.types';
import { SchoolModel } from '../school/school.model';
import { Institution } from '../institution/institution.model';
import { Period } from '../period/period.model';
import { Subject } from '../subject/subject.model';
import { SubjectEvaluationMode } from '../subject/subject.types';
import { ConceptModel } from '../concept/concept.model';
import { findOneScoped, findScoped } from '../../repositories/base.repository';
import AppError from '../../utils/AppError';
import { getImage, keyFromPublicUrl } from '../../services/r2.service';
import {
  IInstitution,
  IPeriod,
  ITeacher,
  IStudent,
  IReportTemplate,
  ILetterConceptOption,
  ILetterSubjectBlock,
  ICommunicativeLetterTemplate,
  IMissingConceptCoverage,
  ILetterAvailability,
} from './report.types';

const ALL_QUALITATIVE_VALUATIONS = Object.values(QualitativeValuation);

interface ReportContext {
  valuation: IStudentValuationDTO;
  institution: IInstitution;
  period: IPeriod;
  teacher: ITeacher;
  student: IStudent;
}

/**
 * Resuelve y valida los datos comunes a cualquier informe basado en una StudentValuation:
 * la valoración debe estar Evaluada, el estudiante debe pertenecer a la institución y,
 * si el solicitante es Docente, debe pertenecer a su sede.
 */
async function buildReportContext(
  valuationId: string,
  institutionId: string,
  requestorRole: UserRole,
  requestorSchoolId?: string
): Promise<ReportContext> {
  const valuation = await getStudentValuationById(valuationId, institutionId);

  if (valuation.globalStatus !== GlobalValuationStatus.COMPLETED) {
    throw new AppError('La Lista de Chequeo aún no está evaluada completamente.', 409);
  }

  const studentDoc = await findOneScoped(User, institutionId, {
    _id: new Types.ObjectId(valuation.studentId),
  }).lean();

  if (!studentDoc) {
    throw new AppError('Estudiante no encontrado o no pertenece a la institución.', 404);
  }

  if (requestorRole === UserRole.DOCENTE && studentDoc.schoolId.toString() !== requestorSchoolId) {
    throw new AppError('No tiene permisos para ver el informe de este estudiante.', 403);
  }

  const [studentSchoolDoc, teacherDoc, institutionDoc, periodDoc] = await Promise.all([
    findOneScoped(SchoolModel, institutionId, { _id: studentDoc.schoolId }).lean(),
    findOneScoped(User, institutionId, { _id: new Types.ObjectId(valuation.teacherId) }).lean(),
    Institution.findById(institutionId).lean(),
    findOneScoped(Period, institutionId, { _id: new Types.ObjectId(valuation.periodId) }).lean(),
  ]);

  if (!studentSchoolDoc || !teacherDoc || !institutionDoc || !periodDoc) {
    throw new AppError('Error de integridad de datos: no se pudo componer el informe.', 500);
  }

  const teacherSchoolDoc = teacherDoc.schoolId.toString() === studentSchoolDoc._id.toString()
    ? studentSchoolDoc
    : await findOneScoped(SchoolModel, institutionId, { _id: teacherDoc.schoolId }).lean();

  if (!teacherSchoolDoc) {
    throw new AppError('Error de integridad de datos: no se encontró la sede del docente.', 500);
  }

  return {
    valuation,
    institution: {
      _id: institutionDoc._id.toString(),
      name: institutionDoc.name,
      daneCode: institutionDoc.daneCode,
      address: institutionDoc.address,
      rectorName: institutionDoc.rectorName,
      email: institutionDoc.email,
      shield: institutionDoc.shieldUrl,
    },
    period: {
      _id: periodDoc._id.toString(),
      name: periodDoc.name,
      year: periodDoc.year,
      isActive: periodDoc.isActive,
    },
    teacher: {
      _id: teacherDoc._id.toString(),
      firstName: teacherDoc.firstName,
      middleName: teacherDoc.middleName,
      lastName: teacherDoc.lastName,
      secondLastName: teacherDoc.secondLastName,
      school: teacherSchoolDoc.name,
    },
    student: {
      _id: studentDoc._id.toString(),
      identificationType: studentDoc.identificationType,
      identificationNumber: studentDoc.identificationNumber,
      firstName: studentDoc.firstName,
      middleName: studentDoc.middleName,
      lastName: studentDoc.lastName,
      secondLastName: studentDoc.secondLastName,
      school: {
        _id: studentSchoolDoc._id.toString(),
        schoolNumber: studentSchoolDoc.schoolNumber,
        name: studentSchoolDoc.name,
      },
      grade: studentDoc.gradesTaught?.[0] ?? '',
    },
  };
}

export async function getChecklistReport(
  valuationId: string,
  institutionId: string,
  requestorRole: UserRole,
  requestorSchoolId?: string
): Promise<IReportTemplate> {
  const { valuation, institution, period, teacher, student } = await buildReportContext(
    valuationId,
    institutionId,
    requestorRole,
    requestorSchoolId
  );

  // La plantilla es solo una referencia; eliminarla no invalida la valoración (docs/domain.md:20-21).
  const templateDoc = await findOneScoped(ChecklistTemplateModel, institutionId, {
    _id: new Types.ObjectId(valuation.checklistTemplateId),
  }).lean();
  const templateName = templateDoc?.name ?? 'Plantilla eliminada';

  return {
    _id: valuation._id,
    institution,
    period,
    teacher,
    student,
    valuation: {
      _id: valuation._id,
      name: templateName,
      globalStatus: valuation.globalStatus,
      valuationsBySubject: valuation.valuationsBySubject,
      observations: valuation.observations,
    },
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Combinaciones dimensión × nivel que aún no tienen ningún Concept en el período dado.
 */
function findMissingConceptCoverage(
  checklistSubjects: { subjectId: string; subjectName: string }[],
  conceptsByKey: Map<string, ILetterConceptOption[]>
): IMissingConceptCoverage[] {
  const missing: IMissingConceptCoverage[] = [];

  checklistSubjects.forEach(subject => {
    const missingValuationTypes = ALL_QUALITATIVE_VALUATIONS.filter(
      level => !(conceptsByKey.get(`${subject.subjectId}|${level}`)?.length)
    );
    if (missingValuationTypes.length > 0) {
      missing.push({ subjectId: subject.subjectId, subjectName: subject.subjectName, missingValuationTypes });
    }
  });

  return missing;
}

export async function getCommunicativeLetterReport(
  valuationId: string,
  institutionId: string,
  requestorRole: UserRole,
  requestorSchoolId?: string
): Promise<ICommunicativeLetterTemplate> {
  const { valuation, institution, period, teacher, student } = await buildReportContext(
    valuationId,
    institutionId,
    requestorRole,
    requestorSchoolId
  );

  const periodConcepts = await findScoped(ConceptModel, institutionId, {
    periodId: new Types.ObjectId(valuation.periodId),
  })
    .select('subjectId valuationType description createdAt')
    .sort({ createdAt: 1 })
    .lean();

  const conceptsByKey = new Map<string, ILetterConceptOption[]>();
  periodConcepts.forEach(concept => {
    const key = `${concept.subjectId.toString()}|${concept.valuationType}`;
    const option: ILetterConceptOption = { _id: concept._id.toString(), description: concept.description };
    const existing = conceptsByKey.get(key);
    if (existing) {
      existing.push(option);
    } else {
      conceptsByKey.set(key, [option]);
    }
  });

  const checklistSubjects = valuation.valuationsBySubject.filter(
    subject => subject.evaluationMode === SubjectEvaluationMode.CHECKLIST
  );

  const missing = findMissingConceptCoverage(checklistSubjects, conceptsByKey);
  if (missing.length > 0) {
    const detail = missing
      .map(m => `${m.subjectName} (falta ${m.missingValuationTypes.join(', ')})`)
      .join(' · ');
    throw new AppError(`Faltan conceptos para generar la Carta Comunicativa: ${detail}.`, 422);
  }

  const subjects: ILetterSubjectBlock[] = valuation.valuationsBySubject.map(subject => {
    if (subject.evaluationMode === SubjectEvaluationMode.DESCRIPTION) {
      return {
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        evaluationMode: SubjectEvaluationMode.DESCRIPTION,
        valuationType: null,
        subjectPercentage: subject.subjectPercentage,
        assignedConceptId: null,
        conceptText: subject.performanceDescription ?? '',
        availableConcepts: [],
      };
    }

    const level = resolveQualitativeValuation(subject.subjectPercentage);
    const candidates = conceptsByKey.get(`${subject.subjectId}|${level}`) ?? [];
    const isAssignmentValid = !!subject.assignedConceptId && candidates.some(c => c._id === subject.assignedConceptId);

    const assignedConceptId = isAssignmentValid ? subject.assignedConceptId! : candidates[0]?._id ?? null;
    const conceptText = isAssignmentValid
      ? (subject.assignedConceptText || candidates.find(c => c._id === assignedConceptId)?.description || '')
      : (candidates[0]?.description ?? '');

    return {
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
      evaluationMode: SubjectEvaluationMode.CHECKLIST,
      valuationType: level,
      subjectPercentage: subject.subjectPercentage,
      assignedConceptId,
      conceptText,
      availableConcepts: candidates,
    };
  });

  return {
    _id: valuation._id,
    institution,
    period,
    teacher,
    student,
    subjects,
    observations: valuation.observations,
    generatedAt: new Date().toISOString(),
  };
}

export async function getLetterAvailability(
  periodId: string,
  institutionId: string
): Promise<ILetterAvailability> {
  const [checklistSubjects, periodConcepts] = await Promise.all([
    findScoped(Subject, institutionId, { evaluationMode: SubjectEvaluationMode.CHECKLIST })
      .select('name')
      .lean(),
    findScoped(ConceptModel, institutionId, { periodId: new Types.ObjectId(periodId) })
      .select('subjectId valuationType')
      .lean(),
  ]);

  const coveredKeys = new Set(
    periodConcepts.map(concept => `${concept.subjectId.toString()}|${concept.valuationType}`)
  );

  const missing: IMissingConceptCoverage[] = [];
  checklistSubjects.forEach(subject => {
    const missingValuationTypes = ALL_QUALITATIVE_VALUATIONS.filter(
      level => !coveredKeys.has(`${subject._id.toString()}|${level}`)
    );
    if (missingValuationTypes.length > 0) {
      missing.push({ subjectId: subject._id.toString(), subjectName: subject.name, missingValuationTypes });
    }
  });

  return { periodId, isAvailable: missing.length === 0, missing };
}

export async function getChecklistReportShield(
  valuationId: string,
  institutionId: string,
  requestorRole: UserRole,
  requestorSchoolId: string | undefined
): Promise<{ buffer: Buffer; contentType: string }> {
  const valuation = await getStudentValuationById(valuationId, institutionId);

  if (valuation.globalStatus !== GlobalValuationStatus.COMPLETED) {
    throw new AppError('La Lista de Chequeo aún no está evaluada completamente.', 409);
  }

  const studentDoc = await findOneScoped(User, institutionId, {
    _id: new Types.ObjectId(valuation.studentId),
  })
    .select('schoolId')
    .lean();

  if (!studentDoc) {
    throw new AppError('Estudiante no encontrado o no pertenece a la institución.', 404);
  }

  if (requestorRole === UserRole.DOCENTE && studentDoc.schoolId.toString() !== requestorSchoolId) {
    throw new AppError('No tiene permisos para ver el informe de este estudiante.', 403);
  }

  const institutionDoc = await Institution.findById(institutionId).select('shieldJpgUrl').lean();
  const key = institutionDoc?.shieldJpgUrl ? keyFromPublicUrl(institutionDoc.shieldJpgUrl) : null;
  if (!key) {
    throw new AppError('Imagen no disponible.', 404);
  }

  const image = await getImage(key);
  if (!image) {
    throw new AppError('Imagen no disponible.', 404);
  }

  return image;
}

export async function getCommunicativeLetterShield(
  valuationId: string,
  institutionId: string,
  requestorRole: UserRole,
  requestorSchoolId: string | undefined
): Promise<{ buffer: Buffer; contentType: string }> {
  const valuation = await getStudentValuationById(valuationId, institutionId);

  if (valuation.globalStatus !== GlobalValuationStatus.COMPLETED) {
    throw new AppError('La Carta Comunicativa aún no está disponible.', 409);
  }

  const studentDoc = await findOneScoped(User, institutionId, {
    _id: new Types.ObjectId(valuation.studentId),
  })
    .select('schoolId')
    .lean();

  if (!studentDoc) {
    throw new AppError('Estudiante no encontrado o no pertenece a la institución.', 404);
  }

  if (requestorRole === UserRole.DOCENTE && studentDoc.schoolId.toString() !== requestorSchoolId) {
    throw new AppError('No tiene permisos para ver el informe de este estudiante.', 403);
  }

  const institutionDoc = await Institution.findById(institutionId).select('shieldJpgUrl').lean();
  const key = institutionDoc?.shieldJpgUrl ? keyFromPublicUrl(institutionDoc.shieldJpgUrl) : null;
  if (!key) {
    throw new AppError('Imagen no disponible.', 404);
  }

  const image = await getImage(key);
  if (!image) {
    throw new AppError('Imagen no disponible.', 404);
  }

  return image;
}
