import { Types } from 'mongoose';
import { getStudentValuationById } from '../student-valuation/student-valuation.service';
import { GlobalValuationStatus } from '../student-valuation/student-valuation.types';
import { ChecklistTemplateModel } from '../checklist-template/checklist-template.model';
import { User } from '../auth/auth.model';
import { UserRole } from '../auth/auth.types';
import { SchoolModel } from '../school/school.model';
import { Institution } from '../institution/institution.model';
import { Period } from '../period/period.model';
import { findOneScoped } from '../../repositories/base.repository';
import AppError from '../../utils/AppError';
import { getImage, keyFromPublicUrl } from '../../services/r2.service';
import { IReportTemplate } from './report.types';

export type ChecklistReportImageKind = 'shield' | 'photo';

export async function getChecklistReport(
  valuationId: string,
  institutionId: string,
  requestorRole: UserRole,
  requestorSchoolId?: string
): Promise<IReportTemplate> {
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

  const [studentSchoolDoc, teacherDoc, institutionDoc, templateDoc, periodDoc] = await Promise.all([
    findOneScoped(SchoolModel, institutionId, { _id: studentDoc.schoolId }).lean(),
    findOneScoped(User, institutionId, { _id: new Types.ObjectId(valuation.teacherId) }).lean(),
    Institution.findById(institutionId).lean(),
    findOneScoped(ChecklistTemplateModel, institutionId, {
      _id: new Types.ObjectId(valuation.checklistTemplateId),
    }).lean(),
    findOneScoped(Period, institutionId, { _id: new Types.ObjectId(valuation.periodId) }).lean(),
  ]);

  if (!studentSchoolDoc || !teacherDoc || !institutionDoc || !periodDoc) {
    throw new AppError('Error de integridad de datos: no se pudo componer el informe.', 500);
  }

  // La plantilla es solo una referencia; eliminarla no invalida la valoración (docs/domain.md:20-21).
  const templateName = templateDoc?.name ?? 'Plantilla eliminada';

  const teacherSchoolDoc = teacherDoc.schoolId.toString() === studentSchoolDoc._id.toString()
    ? studentSchoolDoc
    : await findOneScoped(SchoolModel, institutionId, { _id: teacherDoc.schoolId }).lean();

  if (!teacherSchoolDoc) {
    throw new AppError('Error de integridad de datos: no se encontró la sede del docente.', 500);
  }

  return {
    _id: valuation._id,
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
      avatarUrl: studentDoc.avatarUrl,
    },
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

export async function getChecklistReportImage(
  valuationId: string,
  institutionId: string,
  requestorRole: UserRole,
  requestorSchoolId: string | undefined,
  kind: ChecklistReportImageKind
): Promise<{ buffer: Buffer; contentType: string }> {
  const report = await getChecklistReport(valuationId, institutionId, requestorRole, requestorSchoolId);
  const url = kind === 'shield' ? report.institution.shield : report.student.avatarUrl;

  const key = url ? keyFromPublicUrl(url) : null;
  if (!key) {
    throw new AppError('Imagen no disponible.', 404);
  }

  const image = await getImage(key);
  if (!image) {
    throw new AppError('Imagen no disponible.', 404);
  }

  return image;
}
