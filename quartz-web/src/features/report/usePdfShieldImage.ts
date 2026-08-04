import { useEffect, useState } from "react";
import { apiGet } from "@/api/apiClient";
import { blobToDataUrl } from "@/utils/blobToDataUrl";

export interface PdfImageResult {
  src: string | null;
  isLoading: boolean;
}

export function usePdfShieldImage(valuationId: string | undefined, hasSource: boolean): PdfImageResult {
  const [result, setResult] = useState<PdfImageResult>({ src: null, isLoading: hasSource });

  useEffect(() => {
    let cancelled = false;

    if (!valuationId || !hasSource) {
      setResult({ src: null, isLoading: false });
      return;
    }

    setResult({ src: null, isLoading: true });

    apiGet<Blob>(`/reports/checklist/${valuationId}/shield`, { responseType: "blob" })
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
  }, [valuationId, hasSource]);

  return result;
}
