import { Request, Response } from 'express';
import { getUsersByFilters } from './users.service';

export const getUsers = async (req: Request, res: Response) => {
  const sessionUser = req.user!;
  const { id, role, schoolId } = req.query as { id?: string; role?: string; schoolId?: string };
  const institutionId = sessionUser.institutionId.toString();

  const users = await getUsersByFilters({
    institutionId,
    id,
    role,
    schoolId,
    requestorRole: sessionUser.role,
    requestorSchoolId: sessionUser.schoolId?.toString(),
  });

  res.status(200).json(users);
};
