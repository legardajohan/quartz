import { Request, Response } from 'express';
import { getUsersByFilters, uploadStudentPhoto } from './users.service';
import AppError from '../../utils/AppError';

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

export const uploadStudentPhotoController = async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('Debe adjuntar una imagen.', 422);
  }

  const sessionUser = req.user!;
  const institutionId = sessionUser.institutionId.toString();
  const { studentId } = req.params;

  const student = await uploadStudentPhoto(institutionId, studentId, req.file, {
    role: sessionUser.role,
    schoolId: sessionUser.schoolId?.toString(),
  });

  res.status(200).json(student);
};
