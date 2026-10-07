import { useEffect, useState, type ReactElement } from "react";
import { pdf } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";

type ReportDocument = ReactElement<DocumentProps>;

interface RenderedPdf {
  /** Documento que produjo esta URL; sirve para no mostrar el PDF del informe anterior. */
  document: ReportDocument | null;
  url: string | null;
  error: string | null;
}

export interface ReportPdfState {
  /** URL del blob generado, lista para un `<iframe>` de vista previa o un `<a download>`. */
  url: string | null;
  isRendering: boolean;
  error: string | null;
  /** El PDF del documento vigente está generado y se puede mostrar/descargar. */
  isReady: boolean;
}

/**
 * Genera **una sola vez** el PDF de un documento y expone su URL tanto para la vista previa
 * como para la descarga.
 *
 * Existe para no usar `PDFViewer` + `PDFDownloadLink` juntos: cada uno monta su propio `usePDF`
 * por dentro, así que el mismo documento se renderizaba dos veces, en paralelo y en el hilo
 * principal.
 *
 * Deliberadamente **no** usa `usePDF`: ese hook registra su listener de `change` en un objeto
 * `events` global del módulo, compartido por todas sus instancias, y crea su instancia de `pdf()`
 * al montar aunque todavía no haya documento. Con los dos modales de informe siempre montados,
 * la instancia ociosa (contenedor vacío) reventaba al renderizar el otro informe. `pdf()` directo
 * no registra listeners y solo existe cuando hay algo que renderizar.
 * Ver `quartz-web/docs/known-issues.md`.
 */
export function useReportPdf(document: ReportDocument | null): ReportPdfState {
  const [rendered, setRendered] = useState<RenderedPdf>({ document: null, url: null, error: null });

  useEffect(() => {
    if (!document) return;

    let objectUrl: string | null = null;
    let cancelled = false;

    pdf(document)
      .toBlob()
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setRendered({ document, url: objectUrl, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setRendered({
          document,
          url: null,
          error: err instanceof Error ? err.message : "No se pudo generar el PDF.",
        });
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [document]);

  // Mientras el render en curso no termine, `rendered` sigue apuntando al documento anterior:
  // así la vista previa nunca muestra el PDF del estudiante que se acaba de cerrar.
  const isCurrent = !!document && rendered.document === document;

  return {
    url: isCurrent ? rendered.url : null,
    isRendering: !!document && !isCurrent,
    error: isCurrent ? rendered.error : null,
    isReady: isCurrent && !!rendered.url && !rendered.error,
  };
}
