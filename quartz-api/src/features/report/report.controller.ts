import { Request, Response } from 'express';
import { getChecklistReport, getChecklistReportImage, ChecklistReportImageKind } from './report.service';

export async function getChecklistReportController(req: Request, res: Response) {
  const { valuationId } = req.params;
  const institutionId = req.user!.institutionId.toString();
  const requestorSchoolId = req.user!.schoolId?.toString();

  const report = await getChecklistReport(valuationId, institutionId, req.user!.role, requestorSchoolId);
  res.status(200).json(report);
}

export async function getChecklistReportImageController(req: Request, res: Response) {
  const { valuationId, kind } = req.params;
  const institutionId = req.user!.institutionId.toString();
  const requestorSchoolId = req.user!.schoolId?.toString();

  const image = await getChecklistReportImage(
    valuationId,
    institutionId,
    req.user!.role,
    requestorSchoolId,
    kind as ChecklistReportImageKind
  );

  res.setHeader('Content-Type', image.contentType);
  res.send(image.buffer);
}
