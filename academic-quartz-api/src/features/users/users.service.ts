import { Types } from 'mongoose';
import { User } from '../auth/auth.model';
import { UserRole } from '../auth/auth.types';
import { StudentValuationModel } from '../student-valuation/student-valuation.model';
import { UserWithValuations, ValuationSummary } from './users.types';

export interface GetUsersFilters {
  institutionId: string;
  id?: string;
  role?: string;
  schoolId?: string;
}

export const getUsersByFilters = async (filters: GetUsersFilters): Promise<UserWithValuations[]> => {
  try {
    const query: any = {
      institutionId: new Types.ObjectId(filters.institutionId),
    };

    if (filters.id) {
      query._id = new Types.ObjectId(filters.id);
    }

    // Enforce that only students are returned.
    if (filters.role) {
      if (filters.role !== UserRole.ESTUDIANTE) {
        return [];
      }
      query.role = UserRole.ESTUDIANTE;
    } else {
      query.role = UserRole.ESTUDIANTE;
    }

    if (filters.schoolId) {
      query.schoolId = new Types.ObjectId(filters.schoolId);
    }

    // 1. Fetch the base user data.
    const users = await User.find(query)
      .select({
        role: 1,
        firstName: 1,
        middleName: 1,
        lastName: 1,
        secondLastName: 1,
        identificationType: 1,
        identificationNumber: 1,
        schoolId: 1,
      })
      .lean()
      .exec();

    if (users.length === 0) {
      return [];
    }

    // 2. Fetch all valuations for the found users in a single query.
    const userIds = users.map(user => user._id);
    const valuations = await StudentValuationModel.find({
      studentId: { $in: userIds },
    })
      .select('_id studentId periodId globalStatus') // Seleccionamos los campos necesarios
      .lean()
      .exec();

    // 3. Group valuations by studentId for efficient lookup.
    const valuationsMap = new Map<string, ValuationSummary[]>();
    for (const valuation of valuations) {
      const studentIdStr = valuation.studentId.toString();
      if (!valuationsMap.has(studentIdStr)) {
        valuationsMap.set(studentIdStr, []);
      }
      valuationsMap.get(studentIdStr)!.push({
        _id: valuation._id.toString(),
        periodId: valuation.periodId.toString(),
        status: valuation.globalStatus, // Usamos el valor del enum directamente
      });
    }

    // 4. Map users to the final DTO, enriching them with their valuations.
    const enrichedUsers = users.map(user => {
      const userValuations = valuationsMap.get(user._id.toString()) || [];
      return {
        ...user,
        _id: user._id.toString(),
        schoolId: user.schoolId.toString(),
        valuations: userValuations,
      };
    });

    return enrichedUsers;
  } catch (error) {
    console.error('Error in getUsersByFilters:', error);
    throw error;
  }
};

