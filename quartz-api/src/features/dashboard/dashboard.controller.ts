import { Request, Response } from 'express';
import { getDashboard } from './dashboard.service';
import { GetDashboardQuery } from './dashboard.validation';
import { UserRole } from '../auth/auth.types';

export async function getDashboardController(req: Request, res: Response) {
  const query = req.query as GetDashboardQuery;

  const dashboard = await getDashboard({
    institutionId: req.user!.institutionId.toString(),
    periodId: query.periodId,
    schoolId: query.schoolId,
    shiftId: query.shiftId,
    grade: query.grade,
    requestorRole: req.user!.role as UserRole,
    requestorSchoolId: req.user!.schoolId?.toString(),
  });

  res.status(200).json(dashboard);
}
