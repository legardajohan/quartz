import { Request, Response } from 'express';
import {
  getChecklistReport,
  getCommunicativeLetterReport,
  getLetterAvailability,
  getBulkChecklistReport,
  getBulkCommunicativeLetterReport,
  getConsolidatedChecklistReport,
  getConsolidatedCommunicativeLetterReport,
} from './report.service';

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

export async function getBulkChecklistReportController(req: Request, res: Response) {
  const { valuationIds } = req.body;
  const institutionId = req.user!.institutionId.toString();
  const requestorSchoolId = req.user!.schoolId?.toString();

  const result = await getBulkChecklistReport(valuationIds, institutionId, req.user!.role, requestorSchoolId);
  res.status(200).json(result);
}

export async function getBulkCommunicativeLetterReportController(req: Request, res: Response) {
  const { valuationIds } = req.body;
  const institutionId = req.user!.institutionId.toString();
  const requestorSchoolId = req.user!.schoolId?.toString();

  const result = await getBulkCommunicativeLetterReport(valuationIds, institutionId, req.user!.role, requestorSchoolId);
  res.status(200).json(result);
}

export async function getConsolidatedChecklistReportController(req: Request, res: Response) {
  const institutionId = req.user!.institutionId.toString();
  const requestorSchoolId = req.user!.schoolId?.toString();

  const result = await getConsolidatedChecklistReport(req.body, institutionId, req.user!.role, requestorSchoolId);
  res.status(200).json(result);
}

export async function getConsolidatedCommunicativeLetterReportController(req: Request, res: Response) {
  const institutionId = req.user!.institutionId.toString();
  const requestorSchoolId = req.user!.schoolId?.toString();

  const result = await getConsolidatedCommunicativeLetterReport(req.body, institutionId, req.user!.role, requestorSchoolId);
  res.status(200).json(result);
}
