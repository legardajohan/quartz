import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { useReportStore } from "./useReportStore";
import { useInstitutionShieldQuery } from "@/features/institution/queries/useInstitutionShieldQuery";
import { downloadBlob } from "@/utils/downloadBlob";
import ChecklistReportBulkDocument from "./components/ChecklistReportBulkDocument";
import CommunicativeLetterBulkDocument from "./components/CommunicativeLetterBulkDocument";
import type { IBulkReportSkip, IConsolidatedReportFilters } from "./types";
import type { ReportKind } from "@/types/domain";

export interface BulkDownloadFileNameMeta {
  schoolLabel?: string;
  periodLabel?: string;
}

export interface BulkDownloadResult {
  includedCount: number;
  skipped: IBulkReportSkip[];
}

function todayStamp(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}${month}${day}`;
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

function buildFileName(reportKind: ReportKind, meta?: BulkDownloadFileNameMeta): string {
  const kindSlug = reportKind === "checklist" ? "lista-chequeo" : "carta-comunicativa";
  const schoolSlug = slugify(meta?.schoolLabel || "todas-las-sedes");
  const periodSlug = slugify(meta?.periodLabel || "periodo");
  return `${kindSlug}-consolidado-${schoolSlug}-${periodSlug}-${todayStamp()}.pdf`;
}

export function useBulkReportDownload() {
  const [isDownloading, setIsDownloading] = useState(false);
  const { fetchConsolidatedChecklistReports, fetchConsolidatedCommunicativeLetters } = useReportStore();
  const shield = useInstitutionShieldQuery();

  const download = async (
    reportKind: ReportKind,
    filters: IConsolidatedReportFilters,
    fileNameMeta?: BulkDownloadFileNameMeta
  ): Promise<BulkDownloadResult> => {
    setIsDownloading(true);
    try {
      if (reportKind === "checklist") {
        const result = await fetchConsolidatedChecklistReports(filters);

        if (result.reports.length > 0) {
          const blob = await pdf(
            <ChecklistReportBulkDocument reports={result.reports} shieldSrc={shield.src} />
          ).toBlob();
          downloadBlob(blob, buildFileName(reportKind, fileNameMeta));
        }

        return { includedCount: result.reports.length, skipped: result.skipped };
      }

      const result = await fetchConsolidatedCommunicativeLetters(filters);

      if (result.reports.length > 0) {
        const blob = await pdf(
          <CommunicativeLetterBulkDocument reports={result.reports} shieldSrc={shield.src} />
        ).toBlob();
        downloadBlob(blob, buildFileName(reportKind, fileNameMeta));
      }

      return { includedCount: result.reports.length, skipped: result.skipped };
    } finally {
      setIsDownloading(false);
    }
  };

  return { download, isDownloading };
}
