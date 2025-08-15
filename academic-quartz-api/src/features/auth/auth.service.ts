import { User, IUserDocument, SafeUser } from './auth.model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export async function validateCredentials(
  email: string, 
  password: string
): Promise<SafeUser | null> {
  try {
    // Find user by email only
    const user = await User.findOne({ email }).select('+passwordHash') as IUserDocument | null;
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (isValid) {
      return user.toSafeUser();
    }

    return null;
  } catch (error) {
    console.error("Error al validar las credenciales: ", error); 
    throw new Error('La autenticación falló');
  }
}

export function generateJWT(user: SafeUser) {
  // Only include necessary user information in the JWT
  return jwt.sign(
    {
      sub: user._id,
      role: user.role,
      institutionId: user.institutionId
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}