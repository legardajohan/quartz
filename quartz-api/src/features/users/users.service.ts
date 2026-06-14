import { FilterQuery, Types } from 'mongoose';
import { IUserDocument, User } from '../auth/auth.model';
import { UserRole } from '../auth/auth.types';
import { StudentValuationModel } from '../student-valuation/student-valuation.model';
import { UserWithValuations, School, ValuationSummary } from './users.types';
import { SchoolModel } from '../school/school.model';
import { findScoped } from '../../repositories/base.repository';

export interface GetUsersFilters {
  institutionId: string;
  id?: string;
  role?: string;
  schoolId?: string;
  requestorRole?: UserRole;
  requestorSchoolId?: string;
}

export const getUsersByFilters = async (filters: GetUsersFilters): Promise<UserWithValuations[]> => {
  try {
    const filter: FilterQuery<IUserDocument> = {};

    if (filters.id) {
      filter._id = new Types.ObjectId(filters.id);
    }

    // Enforce that only students are returned.
    if (filters.role) {
      if (filters.role !== UserRole.ESTUDIANTE) {
        return [];
      }
      filter.role = UserRole.ESTUDIANTE;
    } else {
      filter.role = UserRole.ESTUDIANTE;
    }

    // Role-based filtering constraints
    if (filters.requestorRole === UserRole.DOCENTE) {
      if (filters.requestorSchoolId) {
        // Teachers can ONLY see students from their own school.
        filter.schoolId = new Types.ObjectId(filters.requestorSchoolId);
      } else {
        // If a Docente has no schoolId, they shouldn't see any students.
        return [];
      }
    } else {
      // JEFE_DE_AREA (or other future allowed roles)
      if (filters.schoolId) {
        filter.schoolId = new Types.ObjectId(filters.schoolId);
      }
    }

    // 1. Fetch the base user data.
    const users = await findScoped(User, filters.institutionId, filter)
      .select({
        role: 1,
        firstName: 1,
        middleName: 1,
        lastName: 1,
        secondLastName: 1,
        identificationType: 1,
        identificationNumber: 1,
        schoolId: 1,
        gradesTaught: 1,
      })
      .lean()
      .exec();

    if (users.length === 0) {
      return [];
    }

    // 2. Fetch all valuations for the found users in a single query.
    const userIds = users.map(user => user._id);
    const valuations = await findScoped(StudentValuationModel, filters.institutionId, {
      studentId: { $in: userIds },
    })
      .select('_id studentId periodId globalStatus')
      .lean()
      .exec();

    // Fetch schools for the found users in a single query.
    const userSchools = users.map(user => user.schoolId);
    const schools = await findScoped(SchoolModel, filters.institutionId, {
      _id: { $in: userSchools },
    })
      .select('_id schoolNumber name')
      .lean()
      .exec();

    // 3. Group valuations by studentId for efficient lookup.
    const valuationsMap = new Map<string, ValuationSummary[]>();
    for (const valuation of valuations) {
      const studentIdStr = (valuation as any).studentId.toString();
      if (!valuationsMap.has(studentIdStr)) {
        valuationsMap.set(studentIdStr, []);
      }
      valuationsMap.get(studentIdStr)!.push({
        _id: (valuation as any)._id.toString(),
        periodId: (valuation as any).periodId.toString(),
        status: (valuation as any).globalStatus,
      });
    }

    // 4. Map users to the final DTO, enriching them with their valuations.
    const enrichedUsers = users.map(user => {
      const userValuations = valuationsMap.get((user as any)._id.toString()) || [];
      const userSchool = schools.find(s => (s as any)._id.toString() === (user as any).schoolId.toString());

      const schoolDTO = userSchool ? {
        _id: (userSchool as any)._id.toString(),
        schoolNumber: (userSchool as any).schoolNumber,
        name: (userSchool as any).name
      } : undefined;

      const { schoolId, ...userWithoutSchoolId } = user as any;

      return {
        ...userWithoutSchoolId,
        _id: (user as any)._id.toString(),
        school: schoolDTO!,
        gradesTaught: (user as any).gradesTaught || [],
        valuations: userValuations,
      };
    });

    return enrichedUsers;
  } catch (error) {
    console.error('Error in getUsersByFilters:', error);
    throw error;
  }
};
