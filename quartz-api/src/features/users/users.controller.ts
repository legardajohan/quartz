import { Request, Response } from 'express';
import { getUsersByFilters } from './users.service';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const sessionUser = req.user;
    if (!sessionUser || !sessionUser.institutionId) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
    }

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
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching users',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
