import { User, IUserDocument, SafeUser } from './auth.model';
import { IActivationPreview, ISessionData, UserAccountStatus } from './auth.types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Institution } from '../institution/institution.model';
import { hashActivationToken } from '../../utils/activationToken';
import AppError from '../../utils/AppError';
import { getPeriodsByInstitution } from '../period/period.service';
import { getSubjectsByInstitution } from '../subject/subject.service';
import { getChecklistTemplatesForSession } from '../checklist-template/checklist-template.service';
import { getEnabledReports, getShiftSettings } from '../institution/institution.service';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

const PENDING_ACCOUNT_MESSAGE =
    'Tu cuenta aún no está activada. Revisa el correo de invitación o pide a tu Jefe de Área un nuevo enlace.';
const INVALID_ACTIVATION_MESSAGE = 'Este enlace no es válido o ya fue usado.';
const EXPIRED_ACTIVATION_MESSAGE = 'Este enlace expiró. Pide a tu Jefe de Área que te envíe uno nuevo.';

export function toSessionUser(user: SafeUser): ISessionData['user'] {
    return {
        _id: user._id.toString(),
        institutionId: user.institutionId.toString(),
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        secondLastName: user.secondLastName,
        schoolId: user.schoolId.toString(),
        avatarUrl: user.avatarUrl,
    };
}

export async function getSessionData(user: SafeUser): Promise<ISessionData> {
    const institutionId = user.institutionId.toString();
    const userId = user._id.toString();

    const [periods, subjects, checklistTemplates, enabledReports, shiftSettings] = await Promise.all([
        getPeriodsByInstitution(institutionId),
        getSubjectsByInstitution(institutionId),
        getChecklistTemplatesForSession(userId, institutionId),
        getEnabledReports(institutionId),
        getShiftSettings(institutionId),
    ]);

    const sessionData: ISessionData = {
        user: toSessionUser(user),
        periods: periods.map(p => ({ _id: p._id.toString(), name: p.name, isActive: p.isActive })),
        subjects: subjects.map(s => ({ _id: s._id.toString(), name: s.name, type: s.type, evaluationMode: s.evaluationMode })),
        checklistTemplates: checklistTemplates,
        enabledReports,
        multipleShifts: shiftSettings.multipleShifts,
        shifts: shiftSettings.shifts,
    };

    return sessionData;
}

export async function login(email: string, password: string) {
    try {
        // Pre-autenticación: el tenant aún no se conoce en esta etapa. Esta es la única
        // consulta que debe quedar fuera del repositorio tenant-safe de forma deliberada.
        const user = await User.findOne({ email }).select('+passwordHash') as IUserDocument | null;

        if (user?.accountStatus === UserAccountStatus.PENDIENTE) {
            throw new AppError(PENDING_ACCOUNT_MESSAGE, 403);
        }

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (isValid) {
            const safeUser = user.toSafeUser();
            const sessionData = await getSessionData(safeUser);
            const token = generateJWT(safeUser);
            return { token, sessionData };
        }

        return null;
    } catch (error) {
        if (error instanceof AppError) throw error;
        console.error("Error al iniciar sesión: ", error);
        throw new Error('La autenticación falló');
    }
}

export function generateJWT(user: SafeUser) {
  const payload = {
    sub: user._id, 
    institutionId: user.institutionId,
    role: user.role,
    firstName: user.firstName,
  };
  return jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

// ─── Activación de cuenta por invitación (USR-04) ────────────────────────────
// Pre-autenticación: el tenant se desconoce hasta resolver el token. Igual que `login`,
// estas consultas quedan fuera del repositorio tenant-safe de forma deliberada y solo
// alcanzan al usuario dueño del hash. Nunca responden 401: el cliente cerraría sesión.

interface PendingActivationUser {
    _id: unknown;
    institutionId: unknown;
    email?: string;
    firstName: string;
    accountStatus?: UserAccountStatus;
    activationTokenExpiresAt?: Date;
}

async function findPendingUserByToken(token: string): Promise<PendingActivationUser> {
    const user = await User.findOne({ activationTokenHash: hashActivationToken(token) })
        .select('institutionId email firstName accountStatus activationTokenExpiresAt')
        .lean<PendingActivationUser>();

    if (!user || user.accountStatus !== UserAccountStatus.PENDIENTE) {
        throw new AppError(INVALID_ACTIVATION_MESSAGE, 404);
    }
    if (!user.activationTokenExpiresAt || user.activationTokenExpiresAt.getTime() <= Date.now()) {
        throw new AppError(EXPIRED_ACTIVATION_MESSAGE, 410);
    }
    return user;
}

export async function verifyActivationToken(token: string): Promise<IActivationPreview> {
    const user = await findPendingUserByToken(token);
    const institution = await Institution.findById(user.institutionId).select('name').lean();

    return {
        email: user.email ?? '',
        firstName: user.firstName,
        institutionName: institution?.name ?? '',
    };
}

export async function activateAccount(token: string, password: string) {
    const tokenHash = hashActivationToken(token);
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();

    // Hash + estado + vigencia en el mismo filtro: la actualización es atómica y un token
    // no puede consumirse dos veces aunque lleguen dos solicitudes a la vez.
    const activated = await User.findOneAndUpdate(
        {
            activationTokenHash: tokenHash,
            accountStatus: UserAccountStatus.PENDIENTE,
            activationTokenExpiresAt: { $gt: now },
        },
        {
            $set: { passwordHash, accountStatus: UserAccountStatus.ACTIVO, updatedAt: now },
            $unset: { activationTokenHash: 1, activationTokenExpiresAt: 1, invitationSentAt: 1 },
        },
        { new: true }
    ) as IUserDocument | null;

    if (!activated) {
        // Distingue vencido (410) de inválido/usado (404) con el mismo criterio que la verificación.
        await findPendingUserByToken(token);
        throw new AppError(INVALID_ACTIVATION_MESSAGE, 404);
    }

    const safeUser = activated.toSafeUser();
    const sessionData = await getSessionData(safeUser);
    return { token: generateJWT(safeUser), sessionData };
}
