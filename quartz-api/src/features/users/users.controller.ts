import { Request, Response } from 'express';
import {
  getUsersByFilters,
  createUser,
  updateUser,
  deleteUser,
  uploadUserPhoto,
} from './users.service';
import { CreateUserDTO, UpdateUserDTO } from './users.types';
import AppError from '../../utils/AppError';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
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

export const createUserController = async (req: Request, res: Response): Promise<void> => {
  const institutionId = req.user!.institutionId.toString();
  const created = await createUser(institutionId, req.body as CreateUserDTO);
  res.status(201).json(created);
};

export const updateUserController = async (req: Request, res: Response): Promise<void> => {
  const institutionId = req.user!.institutionId.toString();
  const { userId } = req.params;
  const updated = await updateUser(institutionId, userId, req.body as UpdateUserDTO);
  res.status(200).json(updated);
};

export const deleteUserController = async (req: Request, res: Response): Promise<void> => {
  const institutionId = req.user!.institutionId.toString();
  const { userId } = req.params;
  await deleteUser(institutionId, userId);
  res.status(204).send();
};

export const uploadUserPhotoController = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    throw new AppError('Debe adjuntar una imagen.', 422);
  }

  const sessionUser = req.user!;
  const institutionId = sessionUser.institutionId.toString();
  const { userId } = req.params;

  const user = await uploadUserPhoto(institutionId, userId, req.file, {
    role: sessionUser.role,
    schoolId: sessionUser.schoolId?.toString(),
  });

  res.status(200).json(user);
};
