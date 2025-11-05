import { User, IUserDocument, SafeUser } from './auth.model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPeriodsByInstitution } from '../period/period.service';
import { getSubjectsByInstitution } from '../subject/subject.service';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

async function getSessionData(user: SafeUser) {
    const [periods, subjects] = await Promise.all([
        getPeriodsByInstitution(user.institutionId.toString()),
        getSubjectsByInstitution(user.institutionId.toString())
    ]);

    const sessionData = {
        user: {
            _id: user._id,
            institutionId: user.institutionId,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            secondLastName: user.secondLastName,
            schoolId: user.schoolId
        },
        periods: periods.map(p => ({ _id: p._id, name: p.name, isActive: p.isActive })),
        subjects: subjects.map(s => ({ _id: s._id, name: s.name }))
    };

    return sessionData;
}

export async function login(email: string, password: string) {
    try {
        const user = await User.findOne({ email }).select('+passwordHash') as IUserDocument | null;
        if (!user) return null;

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
