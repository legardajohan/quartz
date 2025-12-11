import { Types } from 'mongoose';
import { User } from '../auth/auth.model';
import { UserRole } from '../auth/auth.types';

export interface GetUsersFilters {
  institutionId: string;
  id?: string;
  role?: string;
  schoolId?: string;
}

export const getUsersByFilters = async (filters: GetUsersFilters) => {
  try {
    const query: any = {
      institutionId: new Types.ObjectId(filters.institutionId),
    };

    if (filters.id) {
      query._id = new Types.ObjectId(filters.id);
    }

    // Enforce that only students are returned. If a different role is requested, return empty.
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

    const projection = {
      role: 1,
      firstName: 1,
      middleName: 1,
      lastName: 1,
      secondLastName: 1,
      identificationType: 1,
      identificationNumber: 1,
      phoneNumber: 1,
      schoolId: 1,
    };

    const users = await User.find(query).select(projection).lean().exec();
    return users;
  } catch (error) {
    console.error('Error in getUsersByFilters:', error);
    throw error;
  }
};
