import { Types } from 'mongoose';
import { IUserDocument, User } from '../auth/auth.model';
import { UserRole } from '../auth/auth.types';
import { StudentValuationModel } from '../student-valuation/student-valuation.model';
import { UserWithValuations, School, ValuationSummary } from './users.types';
import { SchoolModel } from '../school/school.model';

export interface GetUsersFilters {
  institutionId: string;
  id?: string;
  role?: string;
  schoolId?: string;
  requestorRole?: UserRole; // Stricter type
  requestorSchoolId?: string;
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

    // Role-based filtering constraints
    if (filters.requestorRole === UserRole.DOCENTE) {
      if (filters.requestorSchoolId) {
        // Teachers can ONLY see students from their own school.
        // We strictly use the schoolId from the user's session, ignoring any passed query param.
        query.schoolId = new Types.ObjectId(filters.requestorSchoolId);
      } else {
        // If a Docente has no schoolId, they shouldn't see any students.
        return [];
      }
    } else {
      // JEFE_DE_AREA (or other future allowed roles)
      // Verify if a specific school was requested for filtering
      if (filters.schoolId) {
        query.schoolId = new Types.ObjectId(filters.schoolId);
      }
      // If no schoolId filter is provided, they will see all users in the institution (default behavior)
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
        gradesTaught: 1,
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

    // Fetch schools for the found users in a single query.
    const userSchools = users.map(user => user.schoolId);
    const schools = await SchoolModel.find({ _id: { $in: userSchools } })
      .select('_id schoolNumber name')
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
      const userSchool = schools.find(s => s._id.toString() === user.schoolId.toString());

      const schoolDTO = userSchool ? {
        _id: userSchool._id.toString(),
        schoolNumber: userSchool.schoolNumber,
        name: userSchool.name
      } : undefined;

      const { schoolId, ...userWithoutSchoolId } = user; // Exclude schoolId from the result if not needed in DTO directly

      return {
        ...userWithoutSchoolId,
        _id: user._id.toString(),
        school: schoolDTO!, // Assert non-null because we know school exists if user exists (integrity constraint) or handle undefined
        gradesTaught: user.gradesTaught || [], // Safe access from lean document
        valuations: userValuations,
      };
    });

    return enrichedUsers;
  } catch (error) {
    console.error('Error in getUsersByFilters:', error);
    throw error;
  }
};

