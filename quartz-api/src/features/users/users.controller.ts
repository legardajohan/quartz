import { Request, Response } from 'express';
import {
  getUsersByFilters,
  createUser,
  updateUser,
  deleteUser,
  uploadUserPhoto,
  getOwnProfile,
  updateOwnProfile,
  changeOwnPassword,
  uploadOwnPhoto,
  resendInvitation,
} from './users.service';
import { CreateUserDTO, UpdateUserDTO, UpdateOwnProfileDTO, ChangeOwnPasswordDTO, StaffRole } from './users.types';
import AppError from '../../utils/AppError';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const sessionUser = req.user!;
  const { id, role, roles, schoolId } = req.query as { id?: string; role?: string; roles?: string; schoolId?: string };
  const institutionId = sessionUser.institutionId.toString();

  const users = await getUsersByFilters({
    institutionId,
    id,
    role,
    // `validate()` no reescribe `req.query`: el CSV ya validado se separa aquí.
    roles: roles ? (roles.split(',') as StaffRole[]) : undefined,
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
  const updated = await updateUser(institutionId, userId, req.body as UpdateUserDTO, {
    userId: req.user!._id.toString(),
    role: req.user!.role,
    schoolId: req.user!.schoolId?.toString(),
  });
  res.status(200).json(updated);
};

export const deleteUserController = async (req: Request, res: Response): Promise<void> => {
  const institutionId = req.user!.institutionId.toString();
  const { userId } = req.params;
  await deleteUser(institutionId, userId, req.user!._id.toString());
  res.status(204).send();
};

export const resendInvitationController = async (req: Request, res: Response): Promise<void> => {
  const institutionId = req.user!.institutionId.toString();
  const { userId } = req.params;
  await resendInvitation(institutionId, userId, req.user!._id.toString());
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

// ─── Mi cuenta (USR-03): el usuario objetivo es siempre el del token ─────────

export const getOwnProfileController = async (req: Request, res: Response): Promise<void> => {
  const institutionId = req.user!.institutionId.toString();
  const profile = await getOwnProfile(institutionId, req.user!._id.toString());
  res.status(200).json(profile);
};

export const updateOwnProfileController = async (req: Request, res: Response): Promise<void> => {
  const institutionId = req.user!.institutionId.toString();
  const profile = await updateOwnProfile(institutionId, req.body as UpdateOwnProfileDTO, {
    userId: req.user!._id.toString(),
    role: req.user!.role,
  });
  res.status(200).json(profile);
};

export const changeOwnPasswordController = async (req: Request, res: Response): Promise<void> => {
  const institutionId = req.user!.institutionId.toString();
  await changeOwnPassword(institutionId, req.user!._id.toString(), req.body as ChangeOwnPasswordDTO);
  res.status(204).send();
};

export const uploadOwnPhotoController = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    throw new AppError('Debe adjuntar una imagen.', 422);
  }

  const institutionId = req.user!.institutionId.toString();
  const profile = await uploadOwnPhoto(institutionId, req.user!._id.toString(), req.file);
  res.status(200).json(profile);
};
