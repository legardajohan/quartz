import { useEffect, useState } from "react";
import { apiGet } from "@/api/apiClient";
import { blobToDataUrl } from "@/utils/blobToDataUrl";

type ReportImageKind = "shield" | "photo";

export interface PdfImageResult {
  src: string | null;
  isLoading: boolean;
}

export function usePdfImage(
  valuationId: string | undefined,
  kind: ReportImageKind,
  hasSource: boolean
): PdfImageResult {
  const [result, setResult] = useState<PdfImageResult>({ src: null, isLoading: hasSource });

  useEffect(() => {
    let cancelled = false;

    if (!valuationId || !hasSource) {
      setResult({ src: null, isLoading: false });
      return;
    }

    setResult({ src: null, isLoading: true });

    apiGet<Blob>(`/reports/checklist/${valuationId}/image/${kind}`, { responseType: "blob" })
      .then(blobToDataUrl)
      .then((src) => {
        if (!cancelled) setResult({ src, isLoading: false });
      })
      .catch(() => {
        if (!cancelled) setResult({ src: null, isLoading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [valuationId, kind, hasSource]);

  return result;
}
