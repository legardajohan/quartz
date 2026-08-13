import { User, IUserDocument, SafeUser } from './auth.model';
import { ISessionData } from './auth.types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPeriodsByInstitution } from '../period/period.service';
import { getSubjectsByInstitution } from '../subject/subject.service';
import { getChecklistTemplatesForSession } from '../checklist-template/checklist-template.service';
import { getEnabledReports, getShiftSettings } from '../institution/institution.service';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export function toSessionUser(user: SafeUser): ISessionData['user'] {
    return {
        _id: user._id.toString(),
        institutionId: user.institutionId.toString(),
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        secondLastName: user.secondLastName,
        schoolId: user.schoolId.toString(),
    };
}

async function getSessionData(user: SafeUser): Promise<ISessionData> {
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
