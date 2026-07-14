import { Request, Response } from 'express';
import { getChecklistReport } from './report.service';

export async function getChecklistReportController(req: Request, res: Response) {
  const { valuationId } = req.params;
  const institutionId = req.user!.institutionId.toString();
  const requestorSchoolId = req.user!.schoolId?.toString();

  const report = await getChecklistReport(valuationId, institutionId, req.user!.role, requestorSchoolId);
  res.status(200).json(report);
}
