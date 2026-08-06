import { Request, Response } from 'express';
import { getChecklistReport, getCommunicativeLetterReport, getLetterAvailability } from './report.service';

export async function getChecklistReportController(req: Request, res: Response) {
  const { valuationId } = req.params;
  const institutionId = req.user!.institutionId.toString();
  const requestorSchoolId = req.user!.schoolId?.toString();

  const report = await getChecklistReport(valuationId, institutionId, req.user!.role, requestorSchoolId);
  res.status(200).json(report);
}

export async function getCommunicativeLetterReportController(req: Request, res: Response) {
  const { valuationId } = req.params;
  const institutionId = req.user!.institutionId.toString();
  const requestorSchoolId = req.user!.schoolId?.toString();

  const report = await getCommunicativeLetterReport(valuationId, institutionId, req.user!.role, requestorSchoolId);
  res.status(200).json(report);
}

export async function getLetterAvailabilityController(req: Request, res: Response) {
  const { periodId } = req.query as { periodId: string };
  const institutionId = req.user!.institutionId.toString();

  const availability = await getLetterAvailability(periodId, institutionId);
  res.status(200).json(availability);
}
