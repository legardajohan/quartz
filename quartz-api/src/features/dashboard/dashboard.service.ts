import { Types } from 'mongoose';
import { StudentValuationModel } from '../student-valuation/student-valuation.model';
import { GlobalValuationStatus, QualitativeValuation, CONCEPT_THRESHOLDS } from '../student-valuation/student-valuation.types';
import { Period } from '../period/period.model';
import { Subject } from '../subject/subject.model';
import { SubjectEvaluationMode } from '../subject/subject.types';
import { User } from '../auth/auth.model';
import { UserRole } from '../auth/auth.types';
import { SchoolModel } from '../school/school.model';
import { getSchoolsByInstitution } from '../school/school.service';
import { LearningModel } from '../learning/learning.model';
import { ConceptModel } from '../concept/concept.model';
import { ChecklistTemplateModel } from '../checklist-template/checklist-template.model';
import { findScoped, findOneScoped, findByIdScoped } from '../../repositories/base.repository';
import { getOrSet } from '../../services/memory-cache.service';
import {
  DashboardFilters,
  IDashboardResponse,
  IPeriodContext,
  ICohortSummary,
  IItemProgress,
  ISubjectPerformanceRow,
  ISubjectConceptRow,
  ITeacherProgressRow,
  ISchoolProgressRow,
  ICurriculumHealth,
  IPeriodTrendPoint,
  IAtRiskStudentRow,
} from './dashboard.types';

const DASHBOARD_CACHE_TTL_MS = 60_000;
const FALLBACK_SUBJECT_NAME = 'Dimensión no disponible';

// -----------------------------------------------------------------------------
// Formas internas del $facet y de las agregaciones auxiliares
// -----------------------------------------------------------------------------

interface FacetIndexRow {
  studentId: Types.ObjectId;
  teacherId: Types.ObjectId;
  globalStatus: GlobalValuationStatus | null;
}

interface FacetItemProgressRow {
  total: number;
  valued: number;
}

interface FacetSubjectLevelRow {
  _id: { subjectId: Types.ObjectId; level: QualitativeValuation | null };
  count: number;
}

interface FacetAtRiskRow {
  _id: Types.ObjectId;
  count: number;
  subjectIds: Types.ObjectId[];
}

interface DashboardFacetResult {
  index: FacetIndexRow[];
  itemProgress: FacetItemProgressRow[];
  subjectPerformance: FacetSubjectLevelRow[];
  subjectConcept: FacetSubjectLevelRow[];
  atRisk: FacetAtRiskRow[];
}

interface CohortStudent {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  secondLastName?: string;
  schoolId: Types.ObjectId;
  avatarUrl?: string;
}

interface LearningsBySubjectRow {
  _id: Types.ObjectId;
  count: number;
}

interface ConceptsBySubjectRow {
  _id: { subjectId: Types.ObjectId; valuationType: QualitativeValuation };
  count: number;
}

interface TrendRow {
  _id: Types.ObjectId;
  averagePercentage: number;
  students: Types.ObjectId[];
}

interface TeacherNameRow {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  secondLastName?: string;
}

// -----------------------------------------------------------------------------
// Punto de entrada — caché por inquilino + rol + filtros
// -----------------------------------------------------------------------------

export async function getDashboard(filters: DashboardFilters): Promise<IDashboardResponse> {
  const effectiveSchoolId = filters.requestorRole === UserRole.DOCENTE
    ? filters.requestorSchoolId
    : filters.schoolId;

  const cacheKey = [
    'dashboard',
    filters.institutionId,
    filters.periodId ?? 'none',
    effectiveSchoolId ?? 'all',
    filters.shiftId ?? 'all',
    filters.grade ?? 'all',
    filters.requestorRole,
  ].join(':');

  return getOrSet(cacheKey, DASHBOARD_CACHE_TTL_MS, () => computeDashboard(filters, effectiveSchoolId));
}

async function computeDashboard(
  filters: DashboardFilters,
  effectiveSchoolId: string | undefined
): Promise<IDashboardResponse> {
  const { institutionId, requestorRole } = filters;
  const isAreaLead = requestorRole === UserRole.JEFE_DE_AREA;

  const [periodDoc, schoolDoc] = await Promise.all([
    filters.periodId
      ? findByIdScoped(Period, institutionId, filters.periodId).lean()
      : findOneScoped(Period, institutionId, { isActive: true }).lean(),
    effectiveSchoolId
      ? findByIdScoped(SchoolModel, institutionId, effectiveSchoolId).select('name').lean()
      : Promise.resolve(null),
  ]);

  const scope: IDashboardResponse['scope'] = {
    role: requestorRole,
    schoolId: effectiveSchoolId ?? null,
    schoolName: schoolDoc?.name ?? null,
    grade: filters.grade ?? null,
    shiftId: filters.shiftId ?? null,
    isInstitutionWide: isAreaLead && !effectiveSchoolId,
  };

  if (!periodDoc) {
    return buildEmptyResponse(null, scope, isAreaLead);
  }

  const period: IPeriodContext = {
    _id: periodDoc._id.toString(),
    name: periodDoc.name,
    year: periodDoc.year,
    startDate: periodDoc.startDate.toISOString(),
    endDate: periodDoc.endDate.toISOString(),
    closingAlertDate: periodDoc.closingAlertDate ? periodDoc.closingAlertDate.toISOString() : null,
    isActive: periodDoc.isActive,
    daysToClose: Math.ceil((periodDoc.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
  };

  const cohort = await findScoped(User, institutionId, {
    role: UserRole.ESTUDIANTE,
    ...(effectiveSchoolId && { schoolId: new Types.ObjectId(effectiveSchoolId) }),
    ...(filters.shiftId && { shiftId: new Types.ObjectId(filters.shiftId) }),
    ...(filters.grade && { gradesTaught: filters.grade }),
  })
    .select('_id firstName lastName secondLastName schoolId avatarUrl')
    .lean<CohortStudent[]>();

  if (cohort.length === 0) {
    return buildEmptyResponse(period, scope, isAreaLead);
  }

  const cohortIds = cohort.map(student => student._id);
  const cohortById = new Map(cohort.map(student => [student._id.toString(), student]));
  const institutionObjectId = new Types.ObjectId(institutionId);
  const periodObjectId = new Types.ObjectId(period._id);

  const [facet] = await StudentValuationModel.aggregate<DashboardFacetResult>([
    { $match: { institutionId: institutionObjectId, periodId: periodObjectId, studentId: { $in: cohortIds } } },
    { $facet: {
      index: [
        { $project: { _id: 0, studentId: 1, teacherId: 1, globalStatus: 1 } },
      ],
      itemProgress: [
        { $unwind: '$valuationsBySubject' },
        { $project: {
          items: {
            $cond: [
              { $eq: ['$valuationsBySubject.evaluationMode', SubjectEvaluationMode.DESCRIPTION] },
              [{ valued: { $ne: ['$valuationsBySubject.performanceDescription', null] } }],
              { $map: {
                input: '$valuationsBySubject.learningValuations',
                as: 'lv',
                in: { valued: { $ne: ['$$lv.qualitativeValuation', null] } },
              } },
            ],
          },
        } },
        { $unwind: '$items' },
        { $group: { _id: null, total: { $sum: 1 }, valued: { $sum: { $cond: ['$items.valued', 1, 0] } } } },
      ],
      subjectPerformance: [
        { $unwind: '$valuationsBySubject' },
        { $unwind: '$valuationsBySubject.learningValuations' },
        { $group: {
          _id: {
            subjectId: '$valuationsBySubject.subjectId',
            level: '$valuationsBySubject.learningValuations.qualitativeValuation',
          },
          count: { $sum: 1 },
        } },
      ],
      subjectConcept: [
        { $unwind: '$valuationsBySubject' },
        { $match: { 'valuationsBySubject.maxSubjectScore': { $gt: 0 } } },
        { $group: {
          _id: {
            subjectId: '$valuationsBySubject.subjectId',
            level: {
              $switch: {
                branches: [
                  { case: { $gte: ['$valuationsBySubject.subjectPercentage', CONCEPT_THRESHOLDS.ACHIEVED] }, then: QualitativeValuation.ACHIEVED },
                  { case: { $gte: ['$valuationsBySubject.subjectPercentage', CONCEPT_THRESHOLDS.IN_PROCESS] }, then: QualitativeValuation.IN_PROCESS },
                ],
                default: QualitativeValuation.WITH_DIFICULTY,
              },
            },
          },
          count: { $sum: 1 },
        } },
      ],
      atRisk: [
        { $unwind: '$valuationsBySubject' },
        { $match: {
          'valuationsBySubject.maxSubjectScore': { $gt: 0 },
          'valuationsBySubject.subjectPercentage': { $lt: CONCEPT_THRESHOLDS.IN_PROCESS },
        } },
        { $group: { _id: '$studentId', count: { $sum: 1 }, subjectIds: { $push: '$valuationsBySubject.subjectId' } } },
        { $match: { count: { $gte: 2 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ],
    } },
  ]);

  const teacherIds = [...new Set(facet.index.map(row => row.teacherId.toString()))]
    .map(id => new Types.ObjectId(id));

  const [subjects, allPeriods, learningsAgg, conceptsAgg, teacherDocs, schools, totalChecklistTemplates] = await Promise.all([
    findScoped(Subject, institutionId, {}).select('name evaluationMode').lean(),
    findScoped(Period, institutionId, {}).select('name year startDate').lean(),
    isAreaLead
      ? LearningModel.aggregate<LearningsBySubjectRow>([
          { $match: { institutionId: institutionObjectId, periodId: periodObjectId } },
          { $group: { _id: '$subjectId', count: { $sum: 1 } } },
        ])
      : Promise.resolve([] as LearningsBySubjectRow[]),
    isAreaLead
      ? ConceptModel.aggregate<ConceptsBySubjectRow>([
          { $match: { institutionId: institutionObjectId, periodId: periodObjectId } },
          { $group: { _id: { subjectId: '$subjectId', valuationType: '$valuationType' }, count: { $sum: 1 } } },
        ])
      : Promise.resolve([] as ConceptsBySubjectRow[]),
    isAreaLead
      ? findScoped(User, institutionId, { _id: { $in: teacherIds } }).select('firstName lastName secondLastName').lean<TeacherNameRow[]>()
      : Promise.resolve([] as TeacherNameRow[]),
    isAreaLead ? getSchoolsByInstitution(institutionId) : Promise.resolve([]),
    isAreaLead
      ? ChecklistTemplateModel.countDocuments({ institutionId: institutionObjectId, periodId: periodObjectId })
      : Promise.resolve(0),
  ]);

  const subjectNames = new Map(subjects.map(subject => [subject._id.toString(), subject.name]));

  let periodTrend: IPeriodTrendPoint[] = [];
  if (allPeriods.length >= 2) {
    const trendDocs = await StudentValuationModel.aggregate<TrendRow>([
      { $match: {
        institutionId: institutionObjectId,
        studentId: { $in: cohortIds },
        periodId: { $in: allPeriods.map(p => p._id) },
      } },
      { $unwind: '$valuationsBySubject' },
      { $match: { 'valuationsBySubject.maxSubjectScore': { $gt: 0 } } },
      { $group: {
        _id: '$periodId',
        averagePercentage: { $avg: '$valuationsBySubject.subjectPercentage' },
        students: { $addToSet: '$studentId' },
      } },
    ]);
    periodTrend = composePeriodTrend(trendDocs, allPeriods);
  }

  return {
    period,
    scope,
    cohort: composeCohortSummary(cohort.length, facet.index),
    itemProgress: composeItemProgress(facet.itemProgress),
    performanceBySubject: composePerformanceBySubject(facet.subjectPerformance, subjectNames),
    conceptBySubject: composeConceptBySubject(facet.subjectConcept, subjectNames),
    teacherProgress: isAreaLead ? composeTeacherProgress(facet.index, teacherDocs) : null,
    schoolProgress: isAreaLead ? composeSchoolProgress(cohort, facet.index, schools) : null,
    curriculumHealth: isAreaLead
      ? composeCurriculumHealth(subjects, learningsAgg, conceptsAgg, totalChecklistTemplates)
      : null,
    periodTrend,
    atRiskStudents: composeAtRiskStudents(facet.atRisk, cohortById, subjectNames),
    generatedAt: new Date().toISOString(),
  };
}

// -----------------------------------------------------------------------------
// Composición — de las filas crudas de Mongo a los DTOs de respuesta
// -----------------------------------------------------------------------------

function formatFullName(user: { firstName: string; lastName: string; secondLastName?: string }): string {
  return [user.firstName, user.lastName, user.secondLastName].filter(Boolean).join(' ');
}

function buildEmptyResponse(
  period: IPeriodContext | null,
  scope: IDashboardResponse['scope'],
  isAreaLead: boolean
): IDashboardResponse {
  return {
    period,
    scope,
    cohort: { totalStudents: 0, evaluated: 0, inProgress: 0, created: 0, notStarted: 0, coveragePercentage: 0 },
    itemProgress: { valuedItems: 0, totalItems: 0, percentage: 0 },
    performanceBySubject: [],
    conceptBySubject: [],
    teacherProgress: isAreaLead ? [] : null,
    schoolProgress: isAreaLead ? [] : null,
    curriculumHealth: isAreaLead
      ? { subjectsWithoutLearnings: [], learningsBySubject: [], missingConcepts: [], totalLearnings: 0, totalConcepts: 0, totalChecklistTemplates: 0 }
      : null,
    periodTrend: [],
    atRiskStudents: [],
    generatedAt: new Date().toISOString(),
  };
}

function composeCohortSummary(totalStudents: number, indexRows: FacetIndexRow[]): ICohortSummary {
  let evaluated = 0;
  let inProgress = 0;
  let created = 0;

  indexRows.forEach(row => {
    if (row.globalStatus === GlobalValuationStatus.COMPLETED) evaluated += 1;
    else if (row.globalStatus === GlobalValuationStatus.IN_PROGRESS) inProgress += 1;
    else created += 1; // GlobalValuationStatus.CREATED o null: "Por diligenciar"
  });

  const notStarted = totalStudents - indexRows.length;

  return {
    totalStudents,
    evaluated,
    inProgress,
    created,
    notStarted,
    coveragePercentage: totalStudents > 0 ? (evaluated / totalStudents) * 100 : 0,
  };
}

function composeItemProgress(rows: FacetItemProgressRow[]): IItemProgress {
  const totals = rows[0];
  const totalItems = totals?.total ?? 0;
  const valuedItems = totals?.valued ?? 0;

  return {
    valuedItems,
    totalItems,
    percentage: totalItems > 0 ? (valuedItems / totalItems) * 100 : 0,
  };
}

function composePerformanceBySubject(
  rows: FacetSubjectLevelRow[],
  subjectNames: Map<string, string>
): ISubjectPerformanceRow[] {
  const bySubject = new Map<string, ISubjectPerformanceRow>();

  rows.forEach(row => {
    const subjectId = row._id.subjectId.toString();
    const entry = bySubject.get(subjectId) ?? {
      subjectId,
      subjectName: subjectNames.get(subjectId) ?? FALLBACK_SUBJECT_NAME,
      achieved: 0,
      inProcess: 0,
      withDificulty: 0,
      pending: 0,
      total: 0,
    };

    entry.total += row.count;
    switch (row._id.level) {
      case QualitativeValuation.ACHIEVED:
        entry.achieved += row.count;
        break;
      case QualitativeValuation.IN_PROCESS:
        entry.inProcess += row.count;
        break;
      case QualitativeValuation.WITH_DIFICULTY:
        entry.withDificulty += row.count;
        break;
      default:
        entry.pending += row.count;
    }

    bySubject.set(subjectId, entry);
  });

  return [...bySubject.values()];
}

function composeConceptBySubject(
  rows: FacetSubjectLevelRow[],
  subjectNames: Map<string, string>
): ISubjectConceptRow[] {
  const bySubject = new Map<string, ISubjectConceptRow>();

  rows.forEach(row => {
    const subjectId = row._id.subjectId.toString();
    const entry = bySubject.get(subjectId) ?? {
      subjectId,
      subjectName: subjectNames.get(subjectId) ?? FALLBACK_SUBJECT_NAME,
      achieved: 0,
      inProcess: 0,
      withDificulty: 0,
      scoredStudents: 0,
    };

    entry.scoredStudents += row.count;
    switch (row._id.level) {
      case QualitativeValuation.ACHIEVED:
        entry.achieved += row.count;
        break;
      case QualitativeValuation.IN_PROCESS:
        entry.inProcess += row.count;
        break;
      default:
        entry.withDificulty += row.count;
    }

    bySubject.set(subjectId, entry);
  });

  return [...bySubject.values()];
}

function composeTeacherProgress(
  indexRows: FacetIndexRow[],
  teacherDocs: TeacherNameRow[]
): ITeacherProgressRow[] {
  const stats = new Map<string, { total: number; evaluated: number }>();

  indexRows.forEach(row => {
    const teacherId = row.teacherId.toString();
    const entry = stats.get(teacherId) ?? { total: 0, evaluated: 0 };
    entry.total += 1;
    if (row.globalStatus === GlobalValuationStatus.COMPLETED) entry.evaluated += 1;
    stats.set(teacherId, entry);
  });

  const teacherNames = new Map(teacherDocs.map(teacher => [teacher._id.toString(), formatFullName(teacher)]));

  const rows: ITeacherProgressRow[] = [...stats.entries()].map(([teacherId, { total, evaluated }]) => ({
    teacherId,
    teacherName: teacherNames.get(teacherId) ?? 'Docente no disponible',
    total,
    evaluated,
    pending: total - evaluated,
    percentage: total > 0 ? (evaluated / total) * 100 : 0,
  }));

  return rows.sort((a, b) => a.percentage - b.percentage);
}

function composeSchoolProgress(
  cohort: CohortStudent[],
  indexRows: FacetIndexRow[],
  schools: { _id: { toString(): string }; name: string }[]
): ISchoolProgressRow[] | null {
  if (schools.length <= 1) return null;

  const totals = new Map<string, number>();
  cohort.forEach(student => {
    const schoolId = student.schoolId.toString();
    totals.set(schoolId, (totals.get(schoolId) ?? 0) + 1);
  });

  const schoolIdByStudent = new Map(cohort.map(student => [student._id.toString(), student.schoolId.toString()]));
  const evaluated = new Map<string, number>();
  indexRows.forEach(row => {
    if (row.globalStatus !== GlobalValuationStatus.COMPLETED) return;
    const schoolId = schoolIdByStudent.get(row.studentId.toString());
    if (!schoolId) return;
    evaluated.set(schoolId, (evaluated.get(schoolId) ?? 0) + 1);
  });

  const schoolNames = new Map(schools.map(school => [school._id.toString(), school.name]));

  return [...totals.entries()].map(([schoolId, totalStudents]) => {
    const evaluatedCount = evaluated.get(schoolId) ?? 0;
    return {
      schoolId,
      schoolName: schoolNames.get(schoolId) ?? 'Sede no disponible',
      totalStudents,
      evaluated: evaluatedCount,
      percentage: totalStudents > 0 ? (evaluatedCount / totalStudents) * 100 : 0,
    };
  });
}

function composeCurriculumHealth(
  subjects: { _id: { toString(): string }; name: string; evaluationMode: SubjectEvaluationMode }[],
  learningsAgg: LearningsBySubjectRow[],
  conceptsAgg: ConceptsBySubjectRow[],
  totalChecklistTemplates: number
): ICurriculumHealth {
  const learningCountBySubject = new Map(learningsAgg.map(row => [row._id.toString(), row.count]));

  const conceptLevelsBySubject = new Map<string, Set<QualitativeValuation>>();
  conceptsAgg.forEach(row => {
    const subjectId = row._id.subjectId.toString();
    const levels = conceptLevelsBySubject.get(subjectId) ?? new Set<QualitativeValuation>();
    levels.add(row._id.valuationType);
    conceptLevelsBySubject.set(subjectId, levels);
  });

  const subjectsWithoutLearnings = subjects
    .filter(subject => subject.evaluationMode === SubjectEvaluationMode.CHECKLIST
      && !learningCountBySubject.has(subject._id.toString()))
    .map(subject => ({ subjectId: subject._id.toString(), subjectName: subject.name }));

  const learningsBySubject = subjects
    .filter(subject => learningCountBySubject.has(subject._id.toString()))
    .map(subject => ({
      subjectId: subject._id.toString(),
      subjectName: subject.name,
      count: learningCountBySubject.get(subject._id.toString())!,
    }));

  const allLevels = Object.values(QualitativeValuation);
  const missingConcepts = subjects
    .map(subject => {
      const levels = conceptLevelsBySubject.get(subject._id.toString()) ?? new Set<QualitativeValuation>();
      const missing = allLevels.filter(level => !levels.has(level));
      return missing.length > 0
        ? { subjectId: subject._id.toString(), subjectName: subject.name, missing }
        : null;
    })
    .filter((row): row is { subjectId: string; subjectName: string; missing: QualitativeValuation[] } => row !== null);

  return {
    subjectsWithoutLearnings,
    learningsBySubject,
    missingConcepts,
    totalLearnings: learningsAgg.reduce((sum, row) => sum + row.count, 0),
    totalConcepts: conceptsAgg.reduce((sum, row) => sum + row.count, 0),
    totalChecklistTemplates,
  };
}

function composePeriodTrend(
  trendDocs: TrendRow[],
  periods: { _id: { toString(): string }; name: string; year: number; startDate: Date }[]
): IPeriodTrendPoint[] {
  if (trendDocs.length < 2) return [];

  const periodById = new Map(periods.map(period => [period._id.toString(), period]));

  const points = trendDocs
    .map(doc => {
      const period = periodById.get(doc._id.toString());
      if (!period) return null;
      return {
        periodId: doc._id.toString(),
        periodName: period.name,
        year: period.year,
        averagePercentage: doc.averagePercentage,
        scoredStudents: doc.students.length,
        startDate: period.startDate,
      };
    })
    .filter((point): point is NonNullable<typeof point> => point !== null);

  if (points.length < 2) return [];

  return points
    .sort((a, b) => a.year - b.year || a.startDate.getTime() - b.startDate.getTime())
    .map(({ startDate, ...point }) => point);
}

function composeAtRiskStudents(
  rows: FacetAtRiskRow[],
  cohortById: Map<string, CohortStudent>,
  subjectNames: Map<string, string>
): IAtRiskStudentRow[] {
  return rows.map(row => {
    const student = cohortById.get(row._id.toString());
    return {
      studentId: row._id.toString(),
      studentName: student ? formatFullName(student) : 'Estudiante no disponible',
      avatarUrl: student?.avatarUrl ?? null,
      subjectsWithDificulty: row.count,
      subjectNames: row.subjectIds.map(subjectId => subjectNames.get(subjectId.toString()) ?? FALLBACK_SUBJECT_NAME),
    };
  });
}
