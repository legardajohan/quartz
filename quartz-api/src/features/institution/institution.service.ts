import { Types } from 'mongoose';
import { Institution } from './institution.model';
import { User } from '../auth/auth.model';
import { GradeLevel, GRADE_LEVELS, UserRole } from '../auth/auth.types';
import { findScoped } from '../../repositories/base.repository';
import {
  IInstitutionDTO,
  IInstitutionBrandingDTO,
  UpdateInstitutionSettingsData,
  ReportKind,
  IShiftDTO,
  IShiftSettings,
  IInstitutionSettings,
} from './institution.types';
import AppError from '../../utils/AppError';
import { assertWebp } from '../../utils/assertWebp';
import { webpToJpeg } from '../../utils/webpToJpeg';
import { uploadImage, deleteImage, getImage, keyFromPublicUrl } from '../../services/r2.service';

const DEFAULT_ENABLED_REPORTS: ReportKind[] = [ReportKind.CHECKLIST, ReportKind.COMMUNICATIVE_LETTER];
const DEFAULT_OFFERED_LEVELS: GradeLevel[] = [GradeLevel.TRANSICION];

// Persistido en el orden en que llegó: se normaliza al canónico 3→5 años para la UI.
function sortLevels(levels: GradeLevel[]): GradeLevel[] {
  return GRADE_LEVELS.filter((level) => levels.includes(level));
}

function resolveOfferedLevels(levels?: GradeLevel[]): GradeLevel[] {
  return levels && levels.length > 0 ? sortLevels(levels) : DEFAULT_OFFERED_LEVELS;
}

const SHIELD_VERSION_RE = /shield-(\d+)\.jpg$/;

function resolveShieldVersion(shieldJpgUrl?: string): string | null {
  return shieldJpgUrl?.match(SHIELD_VERSION_RE)?.[1] ?? null;
}

type PersistedShift = { _id: unknown; name: string };

function mapShiftToDTO(shift: PersistedShift): IShiftDTO {
  return { _id: (shift._id as { toString(): string }).toString(), name: shift.name };
}

function mapInstitutionToDTO(institution: {
  _id: unknown;
  name: string;
  daneCode: string;
  address: string;
  rectorName: string;
  phoneNumber?: string;
  email: string;
  isActive: boolean;
  settings?: Partial<{
    enabledReports: ReportKind[];
    multipleShifts: boolean;
    shifts: PersistedShift[];
    offeredLevels: GradeLevel[];
  }>;
  shieldUrl?: string;
}): IInstitutionDTO {
  return {
    _id: (institution._id as { toString(): string }).toString(),
    name: institution.name,
    daneCode: institution.daneCode,
    address: institution.address,
    rectorName: institution.rectorName,
    phoneNumber: institution.phoneNumber,
    email: institution.email,
    isActive: institution.isActive,
    settings: {
      enabledReports: institution.settings?.enabledReports ?? DEFAULT_ENABLED_REPORTS,
      multipleShifts: institution.settings?.multipleShifts ?? false,
      shifts: (institution.settings?.shifts ?? []).map(mapShiftToDTO),
      offeredLevels: resolveOfferedLevels(institution.settings?.offeredLevels),
    },
    shieldUrl: institution.shieldUrl,
  };
}

export const getEnabledReports = async (institutionId: string): Promise<ReportKind[]> => {
  const institution = await Institution.findById(institutionId).select('settings.enabledReports').lean();
  return institution?.settings?.enabledReports ?? DEFAULT_ENABLED_REPORTS;
};

export const getShiftSettings = async (institutionId: string): Promise<IShiftSettings> => {
  const institution = await Institution.findById(institutionId)
    .select('settings.multipleShifts settings.shifts')
    .lean();

  return {
    multipleShifts: institution?.settings?.multipleShifts ?? false,
    shifts: (institution?.settings?.shifts ?? []).map(mapShiftToDTO),
  };
};

export const getOfferedLevels = async (institutionId: string): Promise<GradeLevel[]> => {
  const institution = await Institution.findById(institutionId).select('settings.offeredLevels').lean();
  return resolveOfferedLevels(institution?.settings?.offeredLevels);
};

// Ajustes transversales (informes habilitados + jornadas + niveles): el Docente los necesita y no
// puede leer `getInstitutionById`, que expone datos administrativos.
export const getInstitutionSettings = async (institutionId: string): Promise<IInstitutionSettings> => {
  const [enabledReports, shiftSettings, offeredLevels] = await Promise.all([
    getEnabledReports(institutionId),
    getShiftSettings(institutionId),
    getOfferedLevels(institutionId),
  ]);
  return { enabledReports, ...shiftSettings, offeredLevels };
};

// Versión mínima de `getInstitutionById` para consumo transversal (p. ej. el sidebar):
// solo nombre + escudo, expuesta a cualquier rol del inquilino (no solo Jefe de Área).
export const getInstitutionBranding = async (institutionId: string): Promise<IInstitutionBrandingDTO> => {
  const institution = await Institution.findById(institutionId).select('name shieldUrl shieldJpgUrl').lean();

  if (!institution) {
    throw new AppError('Institución no encontrada.', 404);
  }

  return {
    name: institution.name,
    shieldUrl: institution.shieldUrl,
    shieldVersion: resolveShieldVersion(institution.shieldJpgUrl),
  };
};

export const getInstitutionShieldJpg = async (
  institutionId: string
): Promise<{ buffer: Buffer; contentType: string; version: string }> => {
  const institution = await Institution.findById(institutionId).select('shieldJpgUrl').lean();

  const key = institution?.shieldJpgUrl ? keyFromPublicUrl(institution.shieldJpgUrl) : null;
  const version = institution?.shieldJpgUrl ? resolveShieldVersion(institution.shieldJpgUrl) : null;
  if (!key || !version) {
    throw new AppError('Imagen no disponible.', 404);
  }

  const image = await getImage(key);
  if (!image) {
    throw new AppError('Imagen no disponible.', 404);
  }

  return { ...image, version };
};

export const getInstitutionById = async (institutionId: string): Promise<IInstitutionDTO> => {
  const institution = await Institution.findById(institutionId).lean();

  if (!institution) {
    throw new AppError('Institución no encontrada.', 404);
  }

  return mapInstitutionToDTO(institution);
};

// Docentes, Jefes de Área, aprendizajes y plantillas no bloquean el cambio: solo los Estudiantes.
async function assertNoStudentsInLevel(institutionId: string, level: GradeLevel): Promise<void> {
  const count = await findScoped(User, institutionId, {
    role: UserRole.ESTUDIANTE,
    gradesTaught: level,
  }).countDocuments();

  if (count > 0) {
    throw new AppError(`El nivel «${level}» tiene ${count} estudiante(s). Cámbialos de nivel antes.`, 409);
  }
}

// Retira el nivel quitado del `gradesTaught` de los Docentes del inquilino; si alguno queda sin
// niveles, recibe todos los que siguen ofertados. El Jefe de Área no se toca.
async function reassignTeachersForRemovedLevels(
  institutionId: string,
  removedLevels: GradeLevel[],
  nextLevels: GradeLevel[]
): Promise<number> {
  if (removedLevels.length === 0) {
    return 0;
  }

  const pulled = await User.updateMany(
    { institutionId, role: UserRole.DOCENTE, gradesTaught: { $in: removedLevels } },
    { $pull: { gradesTaught: { $in: removedLevels } } }
  );

  await User.updateMany(
    { institutionId, role: UserRole.DOCENTE, gradesTaught: { $size: 0 } },
    { $set: { gradesTaught: sortLevels(nextLevels) } }
  );

  return pulled.modifiedCount;
}

export const updateInstitutionSettings = async (
  institutionId: string,
  data: UpdateInstitutionSettingsData
): Promise<IInstitutionDTO> => {
  if (data.enabledReports && data.enabledReports.length === 0) {
    throw new AppError('Debe habilitarse al menos un informe.', 422);
  }

  if (data.offeredLevels && data.offeredLevels.length === 0) {
    throw new AppError('Selecciona al menos un nivel.', 422);
  }

  const current = await Institution.findById(institutionId)
    .select('settings.multipleShifts settings.shifts settings.offeredLevels')
    .lean();

  if (!current) {
    throw new AppError('Institución no encontrada.', 404);
  }

  const currentShifts: PersistedShift[] = current.settings?.shifts ?? [];
  const currentMultiple = current.settings?.multipleShifts ?? false;

  let nextShiftsPersisted: { _id: Types.ObjectId; name: string }[] | undefined;

  if (data.shifts !== undefined) {
    const normalizedNames = data.shifts.map((s) => s.name.trim().toLowerCase());
    const hasDuplicates = new Set(normalizedNames).size !== normalizedNames.length;
    if (hasDuplicates) {
      throw new AppError('Hay jornadas con el nombre repetido.', 422);
    }

    const currentById = new Map(currentShifts.map((s) => [(s._id as Types.ObjectId).toString(), s]));

    nextShiftsPersisted = data.shifts.map((shift) => {
      if (shift._id !== undefined) {
        if (!currentById.has(shift._id)) {
          throw new AppError('La jornada no existe en la institución.', 422);
        }
        return { _id: new Types.ObjectId(shift._id), name: shift.name.trim() };
      }
      return { _id: new Types.ObjectId(), name: shift.name.trim() };
    });
  }

  const nextMultiple = data.multipleShifts ?? currentMultiple;
  const nextShifts = nextShiftsPersisted ?? currentShifts;

  if (nextMultiple && nextShifts.length === 0) {
    throw new AppError('Debe registrar al menos una jornada.', 422);
  }

  if (nextShiftsPersisted !== undefined) {
    const nextIds = new Set(nextShiftsPersisted.map((s) => s._id.toString()));
    const removedShifts = currentShifts.filter((s) => !nextIds.has((s._id as Types.ObjectId).toString()));

    for (const removed of removedShifts) {
      const assignedCount = await User.countDocuments({ institutionId, shiftId: removed._id });
      if (assignedCount > 0) {
        throw new AppError(
          `La jornada «${removed.name}» tiene ${assignedCount} estudiante(s) asignado(s).`,
          409
        );
      }
    }
  }

  if (data.multipleShifts === false && currentMultiple === true) {
    const assignedCount = await User.countDocuments({
      institutionId,
      shiftId: { $exists: true, $ne: null },
    });
    if (assignedCount > 0) {
      throw new AppError(
        'Hay estudiantes con jornada asignada. Quítasela antes de desactivar las jornadas.',
        409
      );
    }
  }

  let removedLevels: GradeLevel[] = [];
  if (data.offeredLevels !== undefined) {
    const nextLevels = new Set(data.offeredLevels);
    removedLevels = resolveOfferedLevels(current.settings?.offeredLevels)
      .filter((level) => !nextLevels.has(level));

    for (const removed of removedLevels) {
      await assertNoStudentsInLevel(institutionId, removed);
    }
  }

  const setPayload: Record<string, unknown> = {};
  if (data.enabledReports !== undefined) {
    setPayload['settings.enabledReports'] = data.enabledReports;
  }
  if (data.multipleShifts !== undefined) {
    setPayload['settings.multipleShifts'] = data.multipleShifts;
  }
  if (nextShiftsPersisted !== undefined) {
    setPayload['settings.shifts'] = nextShiftsPersisted;
  }
  if (data.offeredLevels !== undefined) {
    setPayload['settings.offeredLevels'] = sortLevels(data.offeredLevels);
  }

  const institution = await Institution.findByIdAndUpdate(
    institutionId,
    { $set: setPayload },
    { new: true, runValidators: true }
  ).lean();

  if (!institution) {
    throw new AppError('Institución no encontrada.', 404);
  }

  const dto = mapInstitutionToDTO(institution);

  if (removedLevels.length > 0) {
    const adjustedTeachers = await reassignTeachersForRemovedLevels(
      institutionId,
      removedLevels,
      sortLevels(data.offeredLevels as GradeLevel[])
    );
    if (adjustedTeachers > 0) {
      dto.adjustedTeachers = adjustedTeachers;
    }
  }

  return dto;
};

export const uploadInstitutionShield = async (
  institutionId: string,
  file: Express.Multer.File
): Promise<IInstitutionDTO> => {
  assertWebp(file.buffer);

  const previous = await Institution.findById(institutionId).select('shieldUrl shieldJpgUrl').lean();
  if (!previous) {
    throw new AppError('Institución no encontrada.', 404);
  }

  const timestamp = Date.now();
  const jpegBuffer = await webpToJpeg(file.buffer);

  // Un escudo por institución, subido rara vez y reutilizado en cada informe: se
  // precomputan ambas variantes una sola vez aquí, no en cada apertura de PDF.
  // shieldUrl (.webp) → vistas de la app. shieldJpgUrl (.jpg) → proxy de imagen del informe.
  const [shieldUrl, shieldJpgUrl] = await Promise.all([
    uploadImage(`institutions/${institutionId}/shield-${timestamp}.webp`, file.buffer, 'image/webp'),
    uploadImage(`institutions/${institutionId}/shield-${timestamp}.jpg`, jpegBuffer, 'image/jpeg'),
  ]);

  const institution = await Institution.findByIdAndUpdate(
    institutionId,
    { $set: { shieldUrl, shieldJpgUrl } },
    { new: true, runValidators: true }
  ).lean();

  if (!institution) {
    throw new AppError('Institución no encontrada.', 404);
  }

  await Promise.all(
    [previous.shieldUrl, previous.shieldJpgUrl].map(async (previousUrl) => {
      const previousKey = previousUrl ? keyFromPublicUrl(previousUrl) : null;
      if (previousKey) {
        await deleteImage(previousKey);
      }
    })
  );

  return mapInstitutionToDTO(institution);
};
