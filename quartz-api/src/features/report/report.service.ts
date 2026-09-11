import { Types } from 'mongoose';
import { resolveQualitativeValuation, mapValuationToDTO } from '../student-valuation/student-valuation.service';
import { StudentValuationModel } from '../student-valuation/student-valuation.model';
import { GlobalValuationStatus, QualitativeValuation, IStudentValuationDTO, StudentNameFields } from '../student-valuation/student-valuation.types';
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
import { BULK_REPORT_MAX_ITEMS } from './report.validation';
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
  IBulkReportSkip,
  IBulkChecklistReportResponse,
  IBulkCommunicativeLetterResponse,
  IConsolidatedReportFilters,
} from './report.types';

const ALL_QUALITATIVE_VALUATIONS = Object.values(QualitativeValuation);

interface ReportContext {
  valuation: IStudentValuationDTO;
  institution: IInstitution;
  period: IPeriod;
  teacher: ITeacher;
  student: IStudent;
}

function compareByStudentName(a: ReportContext, b: ReportContext): number {
  return a.student.lastName.localeCompare(b.student.lastName, 'es')
    || a.student.firstName.localeCompare(b.student.firstName, 'es');
}

interface BuildReportContextsResult {
  contexts: ReportContext[];  // en el orden de entrada, ya filtrados
  skipped: IBulkReportSkip[];
}

/**
 * Resuelve y valida en lote los datos comunes a cualquier informe basado en StudentValuation,
 * con un número de consultas a Mongo independiente de `valuationIds.length` (~6, ver plan.md):
 * `$in` por colección, `.lean()` en todas, mapeo en memoria en vez de `populate()`.
 *
 * Nunca lanza por un elemento inválido: lo agrega a `skipped`. Sigue lanzando `AppError(..., 500)`
 * ante una inconsistencia real de datos (institución o sede ausentes).
 */
async function buildReportContexts(
  valuationIds: string[],
  institutionId: string,
  requestorRole: UserRole,
  requestorSchoolId?: string
): Promise<BuildReportContextsResult> {
  const skipped: IBulkReportSkip[] = [];

  // 1. Las valoraciones pedidas, scoped al inquilino: un id inexistente o de otra institución
  // simplemente no aparece aquí, sin revelar su existencia.
  const valuationDocs = await findScoped(StudentValuationModel, institutionId, {
    _id: { $in: valuationIds.map(id => new Types.ObjectId(id)) },
  }).lean();
  const valuationById = new Map(valuationDocs.map(v => [v._id.toString(), v]));

  const pendingValuations: typeof valuationDocs = [];
  valuationIds.forEach(id => {
    const valuation = valuationById.get(id);
    if (!valuation) {
      skipped.push({ valuationId: id, reason: 'not-found' });
      return;
    }
    if (valuation.globalStatus !== GlobalValuationStatus.COMPLETED) {
      skipped.push({ valuationId: id, reason: 'not-completed' });
      return;
    }
    pendingValuations.push(valuation);
  });

  if (pendingValuations.length === 0) {
    return { contexts: [], skipped };
  }

  // 2-5. Estudiantes + docentes, períodos, asignaturas y la institución, todo de una vez.
  const userIds = [...new Set(
    pendingValuations.flatMap(v => [v.studentId.toString(), v.teacherId.toString()])
  )].map(id => new Types.ObjectId(id));
  const periodIds = [...new Set(pendingValuations.map(v => v.periodId.toString()))]
    .map(id => new Types.ObjectId(id));

  const [users, periods, subjectDocs, institutionDoc] = await Promise.all([
    findScoped(User, institutionId, { _id: { $in: userIds } }).lean(),
    findScoped(Period, institutionId, { _id: { $in: periodIds } }).lean(),
    findScoped(Subject, institutionId, {}).select('name evaluationMode').lean(),
    Institution.findById(institutionId).lean(),
  ]);

  if (!institutionDoc) {
    throw new AppError('Error de integridad de datos: no se pudo componer el informe.', 500);
  }

  const userById = new Map(users.map(u => [u._id.toString(), u]));
  const periodById = new Map(periods.map(p => [p._id.toString(), p]));
  const studentNameById = new Map<string, StudentNameFields>(
    users.map(u => [u._id.toString(), {
      firstName: u.firstName,
      middleName: u.middleName,
      lastName: u.lastName,
      secondLastName: u.secondLastName,
    }])
  );
  const periodNameById = new Map(periods.map(p => [p._id.toString(), { name: p.name }]));
  const subjectNameById = new Map(subjectDocs.map(s => [s._id.toString(), { name: s.name }]));

  // 6. Las sedes de estudiantes y docentes, en una sola consulta (los ids salen de #2).
  const schoolIds = [...new Set(users.map(u => u.schoolId.toString()))].map(id => new Types.ObjectId(id));
  const schools = await findScoped(SchoolModel, institutionId, { _id: { $in: schoolIds } }).lean();
  const schoolById = new Map(schools.map(s => [s._id.toString(), s]));

  const institution: IInstitution = {
    _id: institutionDoc._id.toString(),
    name: institutionDoc.name,
    daneCode: institutionDoc.daneCode,
    address: institutionDoc.address,
    rectorName: institutionDoc.rectorName,
    email: institutionDoc.email,
    shield: institutionDoc.shieldUrl,
  };

  const contexts: ReportContext[] = [];

  pendingValuations.forEach(valuationDoc => {
    const valuationId = valuationDoc._id.toString();
    const studentDoc = userById.get(valuationDoc.studentId.toString());

    if (!studentDoc) {
      skipped.push({ valuationId, reason: 'not-found' });
      return;
    }

    if (requestorRole === UserRole.DOCENTE && studentDoc.schoolId.toString() !== requestorSchoolId) {
      skipped.push({ valuationId, reason: 'forbidden-school' });
      return;
    }

    const teacherDoc = userById.get(valuationDoc.teacherId.toString());
    const periodDoc = periodById.get(valuationDoc.periodId.toString());
    const studentSchoolDoc = schoolById.get(studentDoc.schoolId.toString());
    const teacherSchoolDoc = teacherDoc ? schoolById.get(teacherDoc.schoolId.toString()) : undefined;

    if (!teacherDoc || !periodDoc || !studentSchoolDoc || !teacherSchoolDoc) {
      throw new AppError('Error de integridad de datos: no se pudo componer el informe.', 500);
    }

    const valuation = mapValuationToDTO(valuationDoc, studentNameById, periodNameById, subjectNameById);

    contexts.push({
      valuation,
      institution,
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
    });
  });

  return { contexts, skipped };
}

/**
 * Resuelve y valida los datos comunes a un único informe: envoltorio de `buildReportContexts`
 * que traduce el descarte a su `AppError` de siempre, para conservar el contrato HTTP de los
 * endpoints individuales (404 / 409 / 403).
 */
async function buildReportContext(
  valuationId: string,
  institutionId: string,
  requestorRole: UserRole,
  requestorSchoolId?: string
): Promise<ReportContext> {
  const { contexts, skipped } = await buildReportContexts([valuationId], institutionId, requestorRole, requestorSchoolId);

  if (contexts.length > 0) {
    return contexts[0];
  }

  switch (skipped[0]?.reason) {
    case 'not-completed':
      throw new AppError('La Lista de Chequeo aún no está evaluada completamente.', 409);
    case 'forbidden-school':
      throw new AppError('No tiene permisos para ver el informe de este estudiante.', 403);
    default:
      throw new AppError('Valoración no encontrada o no pertenece a la institución.', 404);
  }
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

  return {
    _id: valuation._id,
    institution,
    period,
    teacher,
    student,
    subjects: buildLetterSubjectBlocks(valuation.valuationsBySubject, conceptsByKey),
    observations: valuation.observations,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Bloques de la Carta Comunicativa para las asignaturas de una valoración: en modo `description`
 * usa el texto libre; en modo `checklist` resuelve el concepto asignado (o el primer candidato
 * del nivel) contra `conceptsByKey` (`${subjectId}|${nivel}` → opciones del período).
 */
function buildLetterSubjectBlocks(
  valuationsBySubject: IStudentValuationDTO['valuationsBySubject'],
  conceptsByKey: Map<string, ILetterConceptOption[]>
): ILetterSubjectBlock[] {
  return valuationsBySubject.map(subject => {
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

// -----------------------------------------------------------------------------
// Lote por ids (RPT-07)
// -----------------------------------------------------------------------------

export async function getBulkChecklistReport(
  valuationIds: string[],
  institutionId: string,
  requestorRole: UserRole,
  requestorSchoolId?: string
): Promise<IBulkChecklistReportResponse> {
  const { contexts, skipped } = await buildReportContexts(valuationIds, institutionId, requestorRole, requestorSchoolId);

  if (contexts.length === 0) {
    return { reports: [], skipped };
  }

  // La plantilla es solo una referencia; eliminarla no invalida la valoración (docs/domain.md:20-21).
  const templateIds = [...new Set(contexts.map(c => c.valuation.checklistTemplateId))]
    .map(id => new Types.ObjectId(id));
  const templates = await findScoped(ChecklistTemplateModel, institutionId, { _id: { $in: templateIds } })
    .select('name')
    .lean();
  const templateNameById = new Map(templates.map(t => [t._id.toString(), t.name]));

  const reports: IReportTemplate[] = [...contexts]
    .sort(compareByStudentName)
    .map(({ valuation, institution, period, teacher, student }) => ({
      _id: valuation._id,
      institution,
      period,
      teacher,
      student,
      valuation: {
        _id: valuation._id,
        name: templateNameById.get(valuation.checklistTemplateId) ?? 'Plantilla eliminada',
        globalStatus: valuation.globalStatus,
        valuationsBySubject: valuation.valuationsBySubject,
        observations: valuation.observations,
      },
      generatedAt: new Date().toISOString(),
    }));

  return { reports, skipped };
}

export async function getBulkCommunicativeLetterReport(
  valuationIds: string[],
  institutionId: string,
  requestorRole: UserRole,
  requestorSchoolId?: string
): Promise<IBulkCommunicativeLetterResponse> {
  const { contexts, skipped } = await buildReportContexts(valuationIds, institutionId, requestorRole, requestorSchoolId);

  if (contexts.length === 0) {
    return { reports: [], skipped };
  }

  // Un solo query de Concept para todo el lote, particionado por período en memoria: distintos
  // informes del lote pueden pertenecer a distintos períodos (p. ej. Consolidado con periodos
  // mixtos no aplica hoy, pero /bulk sí puede recibir ids de períodos distintos).
  const periodIds = [...new Set(contexts.map(c => c.period._id))].map(id => new Types.ObjectId(id));
  const periodConcepts = await findScoped(ConceptModel, institutionId, { periodId: { $in: periodIds } })
    .select('subjectId periodId valuationType description createdAt')
    .sort({ createdAt: 1 })
    .lean();

  const conceptsByPeriodId = new Map<string, Map<string, ILetterConceptOption[]>>();
  periodConcepts.forEach(concept => {
    const periodKey = concept.periodId.toString();
    const subjectLevelKey = `${concept.subjectId.toString()}|${concept.valuationType}`;
    const option: ILetterConceptOption = { _id: concept._id.toString(), description: concept.description };

    let conceptsByKey = conceptsByPeriodId.get(periodKey);
    if (!conceptsByKey) {
      conceptsByKey = new Map();
      conceptsByPeriodId.set(periodKey, conceptsByKey);
    }
    const existing = conceptsByKey.get(subjectLevelKey);
    if (existing) {
      existing.push(option);
    } else {
      conceptsByKey.set(subjectLevelKey, [option]);
    }
  });

  const reports: ICommunicativeLetterTemplate[] = [];
  const finalSkipped = [...skipped];

  [...contexts].sort(compareByStudentName).forEach(({ valuation, institution, period, teacher, student }) => {
    const conceptsByKey = conceptsByPeriodId.get(period._id) ?? new Map<string, ILetterConceptOption[]>();
    const checklistSubjects = valuation.valuationsBySubject.filter(
      subject => subject.evaluationMode === SubjectEvaluationMode.CHECKLIST
    );

    const missing = findMissingConceptCoverage(checklistSubjects, conceptsByKey);
    if (missing.length > 0) {
      finalSkipped.push({ valuationId: valuation._id, reason: 'missing-concepts' });
      return;
    }

    reports.push({
      _id: valuation._id,
      institution,
      period,
      teacher,
      student,
      subjects: buildLetterSubjectBlocks(valuation.valuationsBySubject, conceptsByKey),
      observations: valuation.observations,
      generatedAt: new Date().toISOString(),
    });
  });

  return { reports, skipped: finalSkipped };
}

// -----------------------------------------------------------------------------
// Lote por cohorte (RPT-07)
// -----------------------------------------------------------------------------

/**
 * Resuelve los `valuationId` que componen una cohorte (Sede + Grado + Jornada + Período). El
 * `schoolId` del body se ignora por completo cuando el rol es Docente: la cohorte se fuerza a su
 * propia sede.
 */
async function resolveConsolidatedValuationIds(
  filters: IConsolidatedReportFilters,
  institutionId: string,
  requestorRole: UserRole,
  requestorSchoolId?: string
): Promise<string[]> {
  const effectiveSchoolId = requestorRole === UserRole.DOCENTE ? requestorSchoolId : filters.schoolId;

  const studentFilter: Record<string, unknown> = {
    role: UserRole.ESTUDIANTE,
    gradesTaught: filters.grade,
  };
  if (effectiveSchoolId) {
    studentFilter.schoolId = new Types.ObjectId(effectiveSchoolId);
  }
  if (filters.shiftId) {
    studentFilter.shiftId = new Types.ObjectId(filters.shiftId);
  }

  const students = await findScoped(User, institutionId, studentFilter).select('_id').lean();
  if (students.length === 0) {
    return [];
  }

  const valuations = await findScoped(StudentValuationModel, institutionId, {
    studentId: { $in: students.map(s => s._id) },
    periodId: new Types.ObjectId(filters.periodId),
    globalStatus: GlobalValuationStatus.COMPLETED,
  }).select('_id').lean();

  return valuations.map(v => v._id.toString());
}

function assertWithinBulkLimit(count: number): void {
  if (count > BULK_REPORT_MAX_ITEMS) {
    throw new AppError(
      `El grupo tiene ${count} estudiantes evaluados, supera el máximo de ${BULK_REPORT_MAX_ITEMS} por descarga. Ajusta los filtros.`,
      422
    );
  }
}

export async function getConsolidatedChecklistReport(
  filters: IConsolidatedReportFilters,
  institutionId: string,
  requestorRole: UserRole,
  requestorSchoolId?: string
): Promise<IBulkChecklistReportResponse> {
  const valuationIds = await resolveConsolidatedValuationIds(filters, institutionId, requestorRole, requestorSchoolId);
  if (valuationIds.length === 0) {
    return { reports: [], skipped: [] };
  }
  assertWithinBulkLimit(valuationIds.length);

  return getBulkChecklistReport(valuationIds, institutionId, requestorRole, requestorSchoolId);
}

export async function getConsolidatedCommunicativeLetterReport(
  filters: IConsolidatedReportFilters,
  institutionId: string,
  requestorRole: UserRole,
  requestorSchoolId?: string
): Promise<IBulkCommunicativeLetterResponse> {
  const valuationIds = await resolveConsolidatedValuationIds(filters, institutionId, requestorRole, requestorSchoolId);
  if (valuationIds.length === 0) {
    return { reports: [], skipped: [] };
  }
  assertWithinBulkLimit(valuationIds.length);

  return getBulkCommunicativeLetterReport(valuationIds, institutionId, requestorRole, requestorSchoolId);
}

