import { Types, mongo } from 'mongoose';
import { z } from 'zod';
import { User } from '../auth/auth.model';
import { GradeLevel, IdentificationType, UserAccountStatus, UserRole } from '../auth/auth.types';
import { SchoolModel } from '../school/school.model';
import { getShiftSettings, getOfferedLevels } from '../institution/institution.service';
import { findScoped, insertManyScoped } from '../../repositories/base.repository';
import { buildWorkbook, readSheetRows } from '../../services/spreadsheet.service';
import AppError from '../../utils/AppError';
import { issueInvitation, normalizeEmail, isStaffRole } from './users.service';
import {
  IMPORT_MAX_ROWS,
  STAFF_ROLES,
  ImportKind,
  ImportPreview,
  ImportResult,
  ImportRowDTO,
  ImportRowError,
  WritableUserRole,
} from './users.types';

type ImportField =
  | 'role'
  | 'firstName'
  | 'middleName'
  | 'lastName'
  | 'secondLastName'
  | 'identificationType'
  | 'identificationNumber'
  | 'email'
  | 'phoneNumber'
  | 'school'
  | 'shift'
  | 'grade';

interface ImportColumn {
  field: ImportField;
  label: string;
  required: boolean;
}

interface ImportContext {
  schools: Map<string, { _id: string; name: string }>; // Clave: nombre normalizado.
  shifts: Map<string, { _id: string; name: string }>; // Vacío si la institución no usa jornadas.
  multipleShifts: boolean;
  offeredLevels: GradeLevel[];
}

// Lo mínimo para detectar duplicados; `hasErrors` evita que una fila ya inválida "reserve" el valor.
interface DuplicateProbe {
  row: number;
  identificationNumber?: number;
  email?: string;
  hasErrors: boolean;
}

const KIND_LABEL: Record<ImportKind, string> = { students: 'Estudiantes', staff: 'Equipo docente' };
const TEMPLATE_FILENAME: Record<ImportKind, string> = {
  students: 'plantilla-estudiantes.xlsx',
  staff: 'plantilla-equipo-docente.xlsx',
};
const IDENTIFICATION_TYPES = Object.values(IdentificationType);
const STAFF_ROLE_LABELS: string[] = [...STAFF_ROLES];

const REASON_DUPLICATE_IDENTIFICATION = 'Ya existe un usuario con esa identificación en la institución.';
const REASON_DUPLICATE_EMAIL = 'Ya existe un usuario registrado con ese correo.';
const emailSchema = z.string().email();

export function getImportTemplateFilename(kind: ImportKind): string {
  return TEMPLATE_FILENAME[kind];
}

// Comparación sin mayúsculas, tildes ni espacios extremos.
function normalize(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Con un único nivel ofertado no hay columna: se asigna ese nivel (ver `resolveDefaultGrades`).
function buildColumns(kind: ImportKind, ctx: ImportContext): ImportColumn[] {
  const hasLevelChoice = ctx.offeredLevels.length > 1;
  const person: ImportColumn[] = [
    { field: 'firstName', label: 'Primer nombre', required: true },
    { field: 'middleName', label: 'Segundo nombre', required: false },
    { field: 'lastName', label: 'Primer apellido', required: true },
    { field: 'secondLastName', label: 'Segundo apellido', required: false },
    { field: 'identificationType', label: 'Tipo de identificación', required: true },
    { field: 'identificationNumber', label: 'Número de identificación', required: true },
  ];

  if (kind === 'staff') {
    return [
      { field: 'role', label: 'Rol', required: true },
      ...person,
      { field: 'email', label: 'Correo', required: true },
      { field: 'phoneNumber', label: 'Teléfono', required: false },
      { field: 'school', label: 'Sede', required: true },
      // Varios niveles separados por coma; obligatorio para Docente (se valida por fila).
      ...(hasLevelChoice ? [{ field: 'grade' as const, label: 'Niveles', required: false }] : []),
    ];
  }

  return [
    ...person,
    { field: 'phoneNumber', label: 'Teléfono', required: false },
    { field: 'school', label: 'Sede', required: true },
    ...(ctx.multipleShifts ? [{ field: 'shift' as const, label: 'Jornada', required: false }] : []),
    ...(hasLevelChoice ? [{ field: 'grade' as const, label: 'Nivel', required: true }] : []),
  ];
}

function resolveDefaultGrades(role: WritableUserRole, offeredLevels: GradeLevel[]): GradeLevel[] {
  return role !== UserRole.JEFE_DE_AREA && offeredLevels.length === 1 ? [...offeredLevels] : [];
}

// Valida niveles contra los ofertados por el inquilino; vale tanto para el archivo como para el confirm.
function gradeReasons(role: WritableUserRole, grades: GradeLevel[], offeredLevels: GradeLevel[]): string[] {
  const reasons: string[] = [];
  const notOffered = grades.filter((g) => !offeredLevels.includes(g));
  if (notOffered.length > 0) reasons.push(`La institución no ofrece el nivel: ${notOffered.join(', ')}.`);
  if (role === UserRole.ESTUDIANTE && grades.length !== 1) reasons.push('El estudiante debe tener exactamente un nivel.');
  if (role === UserRole.DOCENTE && grades.length === 0) reasons.push('El docente debe tener al menos un nivel.');
  return reasons;
}

const headerOf = (column: ImportColumn): string => (column.required ? `${column.label}*` : column.label);

async function loadImportContext(institutionId: string): Promise<ImportContext> {
  const [schools, shiftSettings, offeredLevels] = await Promise.all([
    findScoped(SchoolModel, institutionId).select('_id name').lean(),
    getShiftSettings(institutionId),
    getOfferedLevels(institutionId),
  ]);

  const toEntry = (s: { _id: unknown; name: string }) => [
    normalize(s.name),
    { _id: String(s._id), name: s.name },
  ] as const;

  return {
    schools: new Map(schools.map(toEntry)),
    shifts: new Map(shiftSettings.multipleShifts ? shiftSettings.shifts.map(toEntry) : []),
    multipleShifts: shiftSettings.multipleShifts,
    offeredLevels,
  };
}

export async function buildImportTemplate(institutionId: string, kind: ImportKind): Promise<Buffer> {
  const ctx = await loadImportContext(institutionId);

  const listFor = (field: ImportField): string[] | undefined => {
    switch (field) {
      case 'school':
        return [...ctx.schools.values()].map((s) => s.name);
      case 'shift':
        return [...ctx.shifts.values()].map((s) => s.name);
      case 'identificationType':
        return IDENTIFICATION_TYPES;
      case 'role':
        return STAFF_ROLE_LABELS;
      // Lista solo para Estudiante: el Equipo docente puede escribir varios niveles separados por coma.
      case 'grade':
        return kind === 'students' ? ctx.offeredLevels : undefined;
      default:
        return undefined;
    }
  };

  return buildWorkbook({
    name: KIND_LABEL[kind],
    columns: buildColumns(kind, ctx).map((column) => ({
      header: headerOf(column),
      list: listFor(column.field),
    })),
  });
}

interface ParsedRow {
  dto?: ImportRowDTO;
  reasons: string[];
  probe: DuplicateProbe;
}

function parseRawRow(
  row: number,
  cells: Record<string, string>,
  columns: ImportColumn[],
  kind: ImportKind,
  ctx: ImportContext
): ParsedRow {
  const reasons: string[] = [];
  const raw = (field: ImportField): string => {
    const column = columns.find((c) => c.field === field);
    return column ? (cells[headerOf(column)] ?? '').trim() : '';
  };

  for (const column of columns) {
    if (column.required && raw(column.field) === '') {
      reasons.push(`"${column.label}" es obligatorio.`);
    }
  }

  let role: WritableUserRole | undefined = kind === 'students' ? UserRole.ESTUDIANTE : undefined;
  if (kind === 'staff' && raw('role') !== '') {
    role = STAFF_ROLES.find((r) => normalize(r) === normalize(raw('role')));
    if (!role) reasons.push('"Rol" no es un valor permitido.');
  }

  const typeText = raw('identificationType');
  const identificationType = IDENTIFICATION_TYPES.find((t) => t === typeText.toUpperCase());
  if (typeText !== '' && !identificationType) {
    reasons.push('"Tipo de identificación" no es un valor permitido.');
  }

  let identificationNumber: number | undefined;
  const numberText = raw('identificationNumber');
  if (numberText !== '') {
    const parsed = Number(numberText);
    if (/^\d+$/.test(numberText) && Number.isSafeInteger(parsed) && parsed > 0) {
      identificationNumber = parsed;
    } else {
      reasons.push('El número de identificación debe ser un entero positivo.');
    }
  }

  let email: string | undefined;
  if (kind === 'staff' && raw('email') !== '') {
    if (emailSchema.safeParse(raw('email')).success) {
      email = normalizeEmail(raw('email'));
    } else {
      reasons.push('El correo no es válido.');
    }
  }

  const school = ctx.schools.get(normalize(raw('school')));
  if (raw('school') !== '' && !school) {
    reasons.push(`La sede "${raw('school')}" no existe en la institución.`);
  }

  let shiftId: string | undefined;
  if (raw('shift') !== '') {
    const shift = ctx.shifts.get(normalize(raw('shift')));
    if (shift) shiftId = shift._id;
    else reasons.push('"Jornada" no es un valor permitido.');
  }

  let gradesTaught: GradeLevel[] = [];
  if (role) {
    const gradeText = raw('grade');
    const gradeColumn = columns.find((c) => c.field === 'grade');
    if (gradeColumn) {
      const tokens = [...new Set(gradeText.split(/[,;]/).map((t) => t.trim()).filter((t) => t !== ''))];
      const unknown = tokens.filter((t) => !ctx.offeredLevels.some((l) => normalize(l) === normalize(t)));
      if (unknown.length > 0) reasons.push(`La institución no ofrece el nivel: ${unknown.join(', ')}.`);
      gradesTaught = ctx.offeredLevels.filter((l) => tokens.some((t) => normalize(t) === normalize(l)));
      // Celda obligatoria vacía: ya se reportó arriba como "es obligatorio".
      const alreadyReported = gradeColumn.required && gradeText === '';
      if (unknown.length === 0 && !alreadyReported) reasons.push(...gradeReasons(role, gradesTaught, ctx.offeredLevels));
    } else {
      gradesTaught = resolveDefaultGrades(role, ctx.offeredLevels);
    }
  }

  const probe: DuplicateProbe = { row, identificationNumber, email, hasErrors: reasons.length > 0 };
  if (reasons.length > 0 || !role || !identificationType || identificationNumber === undefined || !school) {
    return { reasons, probe };
  }

  const dto: ImportRowDTO = {
    row,
    role,
    firstName: raw('firstName'),
    middleName: raw('middleName') || undefined,
    lastName: raw('lastName'),
    secondLastName: raw('secondLastName') || undefined,
    identificationType: identificationType as IdentificationType,
    identificationNumber,
    phoneNumber: raw('phoneNumber') || undefined,
    email,
    schoolId: school._id,
    schoolName: school.name,
    shiftId,
    gradesTaught,
  };
  return { dto, reasons, probe };
}

// Duplicados dentro del archivo (se conserva la primera ocurrencia) y contra la BD.
// La identificación se verifica por inquilino; el correo es global (como `assertUniqueEmail`).
async function findDuplicateReasons(
  institutionId: string,
  probes: DuplicateProbe[]
): Promise<Map<number, string[]>> {
  const reasonsByRow = new Map<number, string[]>();
  const addReason = (row: number, reason: string) => {
    reasonsByRow.set(row, [...(reasonsByRow.get(row) ?? []), reason]);
  };

  const firstById = new Map<number, number>();
  const firstByEmail = new Map<string, number>();
  for (const probe of probes) {
    if (probe.identificationNumber !== undefined) {
      const first = firstById.get(probe.identificationNumber);
      if (first !== undefined) addReason(probe.row, `La identificación está repetida en la fila ${first}.`);
      else if (!probe.hasErrors) firstById.set(probe.identificationNumber, probe.row);
    }
    if (probe.email !== undefined) {
      const first = firstByEmail.get(probe.email);
      if (first !== undefined) addReason(probe.row, `El correo está repetido en la fila ${first}.`);
      else if (!probe.hasErrors) firstByEmail.set(probe.email, probe.row);
    }
  }

  const ids = [...new Set(probes.flatMap((p) => (p.identificationNumber !== undefined ? [p.identificationNumber] : [])))];
  const emails = [...new Set(probes.flatMap((p) => (p.email !== undefined ? [p.email] : [])))];

  const [existingIds, existingEmails] = await Promise.all([
    ids.length
      ? findScoped(User, institutionId, { identificationNumber: { $in: ids } }).select('identificationNumber').lean()
      : [],
    emails.length ? User.find({ email: { $in: emails } }).select('email').lean() : [],
  ]);
  const takenIds = new Set(existingIds.map((u) => u.identificationNumber));
  const takenEmails = new Set(existingEmails.map((u) => u.email));

  for (const probe of probes) {
    if (probe.identificationNumber !== undefined && takenIds.has(probe.identificationNumber)) {
      addReason(probe.row, REASON_DUPLICATE_IDENTIFICATION);
    }
    if (probe.email !== undefined && takenEmails.has(probe.email)) {
      addReason(probe.row, REASON_DUPLICATE_EMAIL);
    }
  }
  return reasonsByRow;
}

function sortErrors(errors: ImportRowError[]): ImportRowError[] {
  return [...errors].sort((a, b) => a.row - b.row);
}

export async function previewImport(
  institutionId: string,
  kind: ImportKind,
  buffer: Buffer
): Promise<ImportPreview> {
  const ctx = await loadImportContext(institutionId);
  const columns = buildColumns(kind, ctx);

  const sheetRows = await readSheetRows(
    buffer,
    columns.map(headerOf),
    `El archivo no corresponde a la plantilla de ${KIND_LABEL[kind]}. Descarga la plantilla e inténtalo de nuevo.`
  );
  if (sheetRows.length === 0) {
    throw new AppError('El archivo no tiene filas con datos.', 422);
  }
  if (sheetRows.length > IMPORT_MAX_ROWS[kind]) {
    throw new AppError(
      `El archivo supera el máximo de ${IMPORT_MAX_ROWS[kind]} filas para ${KIND_LABEL[kind]}.`,
      422
    );
  }

  const parsed = sheetRows.map((r) => parseRawRow(r.row, r.cells, columns, kind, ctx));
  const duplicateReasons = await findDuplicateReasons(institutionId, parsed.map((p) => p.probe));

  const valid: ImportRowDTO[] = [];
  const invalid: ImportRowError[] = [];
  for (const p of parsed) {
    const reasons = [...p.reasons, ...(duplicateReasons.get(p.probe.row) ?? [])];
    if (reasons.length === 0 && p.dto) valid.push(p.dto);
    else invalid.push({ row: p.probe.row, reasons });
  }
  return { valid, invalid };
}

// Revalida lo que el cliente envía de vuelta: nada de la preview se considera confiable.
function revalidateRow(row: ImportRowDTO, kind: ImportKind, ctx: ImportContext): string[] {
  const reasons: string[] = [];

  const roleAllowed = kind === 'students' ? row.role === UserRole.ESTUDIANTE : isStaffRole(row.role);
  if (!roleAllowed) reasons.push('"Rol" no es un valor permitido.');

  const schoolExists = [...ctx.schools.values()].some((s) => s._id === row.schoolId);
  if (!schoolExists) reasons.push(`La sede "${row.schoolName}" no existe en la institución.`);

  if (row.shiftId !== undefined) {
    const shiftAllowed = row.role === UserRole.ESTUDIANTE && [...ctx.shifts.values()].some((s) => s._id === row.shiftId);
    if (!shiftAllowed) reasons.push('"Jornada" no es un valor permitido.');
  }

  reasons.push(...gradeReasons(row.role, row.gradesTaught, ctx.offeredLevels));

  if (kind === 'staff') {
    if (!row.email) reasons.push('"Correo" es obligatorio.');
    else if (!emailSchema.safeParse(row.email).success) reasons.push('El correo no es válido.');
  }
  return reasons;
}

function buildUserDoc(row: ImportRowDTO) {
  const isStaff = isStaffRole(row.role);
  return {
    _id: new Types.ObjectId(),
    role: row.role,
    firstName: row.firstName,
    middleName: row.middleName,
    lastName: row.lastName,
    secondLastName: row.secondLastName,
    identificationType: row.identificationType,
    identificationNumber: row.identificationNumber,
    phoneNumber: row.phoneNumber,
    schoolId: new Types.ObjectId(row.schoolId),
    gradesTaught: row.gradesTaught,
    ...(row.shiftId ? { shiftId: new Types.ObjectId(row.shiftId) } : {}),
    // Sin contraseña: la crea el propio usuario desde el enlace de invitación (USR-04).
    ...(isStaff ? { email: normalizeEmail(row.email as string), accountStatus: UserAccountStatus.PENDIENTE } : {}),
  };
}

// Inserta sin orden: una colisión de unicidad (carrera concurrente) no frena las demás filas.
// Los ids se asignan de antemano para saber, tras el error, cuáles quedaron guardadas.
async function insertRows(
  institutionId: string,
  docs: ReturnType<typeof buildUserDoc>[]
): Promise<Set<string>> {
  try {
    await insertManyScoped(User, institutionId, docs);
    return new Set(docs.map((d) => String(d._id)));
  } catch (error) {
    if (!(error instanceof mongo.MongoBulkWriteError)) throw error;

    const writeErrors = Array.isArray(error.writeErrors) ? error.writeErrors : [error.writeErrors];
    if (writeErrors.some((e) => e.code !== 11000)) throw error;

    const persisted = await findScoped(User, institutionId, { _id: { $in: docs.map((d) => d._id) } })
      .select('_id')
      .lean();
    return new Set(persisted.map((u) => String(u._id)));
  }
}

export async function confirmImport(
  institutionId: string,
  kind: ImportKind,
  rows: ImportRowDTO[]
): Promise<ImportResult> {
  const ctx = await loadImportContext(institutionId);

  const probes: DuplicateProbe[] = rows.map((r) => ({
    row: r.row,
    identificationNumber: r.identificationNumber,
    email: r.email !== undefined && isStaffRole(r.role) ? normalizeEmail(r.email) : undefined,
    hasErrors: false,
  }));
  const duplicateReasons = await findDuplicateReasons(institutionId, probes);

  const skipped: ImportRowError[] = [];
  const accepted: ImportRowDTO[] = [];
  for (const row of rows) {
    const reasons = [...revalidateRow(row, kind, ctx), ...(duplicateReasons.get(row.row) ?? [])];
    if (reasons.length > 0) skipped.push({ row: row.row, reasons });
    else accepted.push(row);
  }

  const docs = accepted.map(buildUserDoc);
  const persistedIds = docs.length ? await insertRows(institutionId, docs) : new Set<string>();

  const created: { row: ImportRowDTO; id: string }[] = [];
  accepted.forEach((row, i) => {
    const id = String(docs[i]._id);
    if (persistedIds.has(id)) created.push({ row, id });
    else skipped.push({ row: row.row, reasons: [REASON_DUPLICATE_IDENTIFICATION] });
  });

  // Secuencial: ~100 correos caben en la petición y no saturan el SMTP.
  const invitationsFailed: ImportResult['invitationsFailed'] = [];
  for (const { row, id } of created.filter((c) => isStaffRole(c.row.role))) {
    try {
      await issueInvitation(institutionId, id);
    } catch (error) {
      console.error('No se pudo enviar la invitación del usuario', id, error);
      invitationsFailed.push({ row: row.row, email: normalizeEmail(row.email as string) });
    }
  }

  return { created: created.length, skipped: sortErrors(skipped), invitationsFailed };
}
