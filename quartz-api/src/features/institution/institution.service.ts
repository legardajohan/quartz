import { Institution } from './institution.model';
import { IInstitutionDTO, UpdateInstitutionSettingsData, ReportKind } from './institution.types';
import AppError from '../../utils/AppError';
import { assertWebp } from '../../utils/assertWebp';
import { webpToJpeg } from '../../utils/webpToJpeg';
import { uploadImage, deleteImage, keyFromPublicUrl } from '../../services/r2.service';

const DEFAULT_ENABLED_REPORTS: ReportKind[] = [ReportKind.CHECKLIST, ReportKind.COMMUNICATIVE_LETTER];

function mapInstitutionToDTO(institution: {
  _id: unknown;
  name: string;
  daneCode: string;
  address: string;
  rectorName: string;
  phoneNumber?: string;
  email: string;
  isActive: boolean;
  settings?: Partial<IInstitutionDTO['settings']>;
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
    },
    shieldUrl: institution.shieldUrl,
  };
}

export const getEnabledReports = async (institutionId: string): Promise<ReportKind[]> => {
  const institution = await Institution.findById(institutionId).select('settings.enabledReports').lean();
  return institution?.settings?.enabledReports ?? DEFAULT_ENABLED_REPORTS;
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

  const setPayload: Record<string, unknown> = {};
  if (data.enabledReports !== undefined) {
    setPayload['settings.enabledReports'] = data.enabledReports;
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
