import { User, IUserDocument, SafeUser, PASSWORD_RESET_UNSET } from './auth.model';
import { IActivationPreview, IPasswordResetPreview, ISessionData, UserAccountStatus } from './auth.types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Institution } from '../institution/institution.model';
import {
    generatePasswordResetToken,
    hashActivationToken,
    INVITATION_RESEND_COOLDOWN_MS,
    PASSWORD_RESET_COOLDOWN_MS,
} from '../../utils/activationToken';
import { sendMail } from '../../services/mail.service';
import { buildPasswordResetEmail } from '../../services/password-reset-email.template';
import { issueInvitation, normalizeEmail } from '../users/users.service';
import { STAFF_ROLES } from '../users/users.types';
import AppError from '../../utils/AppError';
import { getJwtSecret } from '../../utils/jwtSecret';
import { getPeriodsByInstitution, mapPeriodToDTO } from '../period/period.service';
import { getSubjectsByInstitution, mapSubjectToDTO } from '../subject/subject.service';
import { getInstitutionSettings } from '../institution/institution.service';

const PENDING_ACCOUNT_MESSAGE =
    'Tu cuenta aún no está activada. Revisa el correo de invitación o pide a tu Jefe de Área un nuevo enlace.';
const INVALID_ACTIVATION_MESSAGE = 'Este enlace no es válido o ya fue usado.';
const EXPIRED_ACTIVATION_MESSAGE = 'Este enlace expiró. Pide a tu Jefe de Área que te envíe uno nuevo.';
export const PASSWORD_RESET_REQUESTED_MESSAGE =
    'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.';
const INVALID_RESET_MESSAGE = 'Este enlace no es válido o ya fue usado.';
const EXPIRED_RESET_MESSAGE = 'Este enlace expiró. Solicita uno nuevo.';

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

    const [periods, subjects, settings] = await Promise.all([
        getPeriodsByInstitution(institutionId),
        getSubjectsByInstitution(institutionId),
        getInstitutionSettings(institutionId),
    ]);

    const sessionData: ISessionData = {
        user: toSessionUser(user),
        periods: periods.map(mapPeriodToDTO),
        subjects: subjects.map(mapSubjectToDTO),
        enabledReports: settings.enabledReports,
        multipleShifts: settings.multipleShifts,
        shifts: settings.shifts,
        offeredLevels: settings.offeredLevels,
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
    getJwtSecret(),
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
            $unset: { activationTokenHash: 1, activationTokenExpiresAt: 1, invitationSentAt: 1, ...PASSWORD_RESET_UNSET },
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

// ─── Recuperación de contraseña (AUTH-04) ────────────────────────────────────
// Pre-autenticación, igual que `login` y la activación: las consultas por email o por
// hash del token quedan fuera del repositorio tenant-safe y solo alcanzan al usuario
// dueño. Nunca responden 401: el cliente cerraría sesión.

interface PasswordResetCandidate {
    _id: unknown;
    institutionId: unknown;
    email?: string;
    firstName: string;
    passwordHash?: string;
    accountStatus?: UserAccountStatus;
    invitationSentAt?: Date;
    passwordResetSentAt?: Date;
}

interface PasswordResetHolder {
    email?: string;
    firstName: string;
    passwordResetTokenExpiresAt?: Date;
}

function isWithinCooldown(sentAt: Date | undefined, cooldownMs: number): boolean {
    return !!sentAt && Date.now() - sentAt.getTime() < cooldownMs;
}

function logMailError(error: unknown): void {
    console.error('Error al enviar el correo de recuperación de contraseña: ', error);
}

function buildResetUrl(token: string): string {
    const webOrigin = (process.env.WEB_ORIGIN ?? '').replace(/\/+$/, '');
    return `${webOrigin}/restablecer-contrasena?token=${encodeURIComponent(token)}`;
}

async function sendPasswordResetEmail(user: PasswordResetCandidate, token: string, expiresAt: Date): Promise<void> {
    const institution = await Institution.findById(user.institutionId).select('name').lean();
    const email = buildPasswordResetEmail({
        firstName: user.firstName,
        institutionName: institution?.name ?? '',
        resetUrl: buildResetUrl(token),
        expiresAt,
    });
    await sendMail({ to: user.email as string, ...email });
}

// Nunca revela si el correo existe: el controller responde siempre el mismo mensaje y el
// correo se envía sin `await`, así que ni el contenido ni el tiempo de respuesta lo delatan.
export async function requestPasswordReset(rawEmail: string): Promise<void> {
    const user = await User.findOne({ email: normalizeEmail(rawEmail), role: { $in: STAFF_ROLES } })
        .select('institutionId email firstName accountStatus invitationSentAt passwordResetSentAt +passwordHash')
        .lean<PasswordResetCandidate>();

    if (!user?.email) return;

    // Cuenta sin activar: se le reenvía la invitación (con su propio enfriamiento).
    if (user.accountStatus === UserAccountStatus.PENDIENTE) {
        if (isWithinCooldown(user.invitationSentAt, INVITATION_RESEND_COOLDOWN_MS)) return;
        void issueInvitation(String(user.institutionId), String(user._id)).catch(logMailError);
        return;
    }

    if (!user.passwordHash || isWithinCooldown(user.passwordResetSentAt, PASSWORD_RESET_COOLDOWN_MS)) return;

    const { token, tokenHash, expiresAt } = generatePasswordResetToken();
    // Se persiste antes del envío: un token nuevo invalida el anterior aunque el SMTP falle.
    await User.updateOne(
        { _id: user._id },
        { $set: { passwordResetTokenHash: tokenHash, passwordResetTokenExpiresAt: expiresAt, passwordResetSentAt: new Date() } }
    );

    void sendPasswordResetEmail(user, token, expiresAt).catch(logMailError);
}

async function findUserByResetToken(token: string): Promise<PasswordResetHolder> {
    const user = await User.findOne({ passwordResetTokenHash: hashActivationToken(token) })
        .select('email firstName passwordResetTokenExpiresAt')
        .lean<PasswordResetHolder>();

    if (!user) {
        throw new AppError(INVALID_RESET_MESSAGE, 404);
    }
    if (!user.passwordResetTokenExpiresAt || user.passwordResetTokenExpiresAt.getTime() <= Date.now()) {
        throw new AppError(EXPIRED_RESET_MESSAGE, 410);
    }
    return user;
}

export async function verifyPasswordResetToken(token: string): Promise<IPasswordResetPreview> {
    const user = await findUserByResetToken(token);
    return { email: user.email ?? '', firstName: user.firstName };
}

export async function resetPassword(token: string, password: string): Promise<void> {
    const tokenHash = hashActivationToken(token);
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();

    // Hash + vigencia en el mismo filtro: atómico, un token no se consume dos veces.
    const updated = await User.findOneAndUpdate(
        { passwordResetTokenHash: tokenHash, passwordResetTokenExpiresAt: { $gt: now } },
        { $set: { passwordHash, updatedAt: now }, $unset: PASSWORD_RESET_UNSET }
    ).select('_id').lean();

    if (!updated) {
        // Distingue vencido (410) de inválido/usado (404) con el mismo criterio que la verificación.
        await findUserByResetToken(token);
        throw new AppError(INVALID_RESET_MESSAGE, 404);
    }
}
