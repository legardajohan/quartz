import { useEffect, useState } from "react";
import { apiGet } from "@/api/apiClient";
import { blobToJpegDataUrl } from "@/utils/blobToJpegDataUrl";

type ReportImageKind = "shield" | "photo";

export function usePdfImage(
  valuationId: string | undefined,
  kind: ReportImageKind,
  hasSource: boolean
): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDataUrl(null);

    if (!valuationId || !hasSource) {
      return;
    }

    apiGet<Blob>(`/reports/checklist/${valuationId}/image/${kind}`, { responseType: "blob" })
      .then((blob) => blobToJpegDataUrl(blob))
      .then((result) => {
        if (!cancelled) setDataUrl(result);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [valuationId, kind, hasSource]);

  return dataUrl;
}
