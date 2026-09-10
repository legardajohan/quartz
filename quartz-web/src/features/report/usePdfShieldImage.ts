import { useEffect, useState } from "react";
import { apiGet, REPORT_REQUEST_TIMEOUT_MS } from "@/api/apiClient";
import { blobToDataUrl } from "@/utils/blobToDataUrl";

export interface PdfImageResult {
  src: string | null;
  isLoading: boolean;
}

export type PdfShieldReportKind = "checklist" | "communicative-letter";

export function usePdfShieldImage(
  valuationId: string | undefined,
  hasSource: boolean,
  reportKind: PdfShieldReportKind
): PdfImageResult {
  const [src, setSrc] = useState<string | null>(null);
  const [resolvedKey, setResolvedKey] = useState<string | null>(null);

  // La clave representa "qué escudo se está pidiendo ahora mismo". isLoading se deriva de
  // compararla contra la última clave resuelta, en el propio render — así no depende de un
  // useEffect que corre un ciclo después y evita el parpadeo del PDFViewer (montar sin escudo,
  // desmontar, volver a montar con el escudo ya cargado).
  const key = valuationId && hasSource ? `${reportKind}:${valuationId}` : null;

  useEffect(() => {
    let cancelled = false;

    if (!key || !valuationId) {
      setSrc(null);
      setResolvedKey(null);
      return;
    }

    apiGet<Blob>(`/reports/${reportKind}/${valuationId}/shield`, {
      responseType: "blob",
      timeout: REPORT_REQUEST_TIMEOUT_MS,
    })
      .then(blobToDataUrl)
      .then((dataUrl) => {
        if (cancelled) return;
        setSrc(dataUrl);
        setResolvedKey(key);
      })
      .catch(() => {
        if (cancelled) return;
        setSrc(null);
        setResolvedKey(key);
      });

    return () => {
      cancelled = true;
    };
  }, [key, valuationId, reportKind]);

  return { src, isLoading: !!key && resolvedKey !== key };
}
