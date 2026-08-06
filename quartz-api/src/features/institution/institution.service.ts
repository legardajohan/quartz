import { Types } from 'mongoose';
import { Institution } from './institution.model';
import { User } from '../auth/auth.model';
import {
  IInstitutionDTO,
  IInstitutionBrandingDTO,
  UpdateInstitutionSettingsData,
  ReportKind,
  IShiftDTO,
  IShiftSettings,
} from './institution.types';
import AppError from '../../utils/AppError';
import { assertWebp } from '../../utils/assertWebp';
import { webpToJpeg } from '../../utils/webpToJpeg';
import { uploadImage, deleteImage, keyFromPublicUrl } from '../../services/r2.service';

const DEFAULT_ENABLED_REPORTS: ReportKind[] = [ReportKind.CHECKLIST, ReportKind.COMMUNICATIVE_LETTER];

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
  settings?: Partial<{ enabledReports: ReportKind[]; multipleShifts: boolean; shifts: PersistedShift[] }>;
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

// Versión mínima de `getInstitutionById` para consumo transversal (p. ej. el sidebar):
// solo nombre + escudo, expuesta a cualquier rol del inquilino (no solo Jefe de Área).
export const getInstitutionBranding = async (institutionId: string): Promise<IInstitutionBrandingDTO> => {
  const institution = await Institution.findById(institutionId).select('name shieldUrl').lean();

  if (!institution) {
    throw new AppError('Institución no encontrada.', 404);
  }

  return { name: institution.name, shieldUrl: institution.shieldUrl };
};

export const getInstitutionById = async (institutionId: string): Promise<IInstitutionDTO> => {
  const institution = await Institution.findById(institutionId).lean();

  if (!institution) {
    throw new AppError('Institución no encontrada.', 404);
  }

  return mapInstitutionToDTO(institution);
};

export const updateInstitutionSettings = async (
  institutionId: string,
  data: UpdateInstitutionSettingsData
): Promise<IInstitutionDTO> => {
  if (data.enabledReports && data.enabledReports.length === 0) {
    throw new AppError('Debe habilitarse al menos un informe.', 422);
  }

  const current = await Institution.findById(institutionId)
    .select('settings.multipleShifts settings.shifts')
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

  const institution = await Institution.findByIdAndUpdate(
    institutionId,
    { $set: setPayload },
    { new: true, runValidators: true }
  ).lean();

  if (!institution) {
    throw new AppError('Institución no encontrada.', 404);
  }

  return mapInstitutionToDTO(institution);
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
