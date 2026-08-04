import { useEffect, useState } from "react";
import { remoteImageToJpegDataUrl } from "@/utils/remoteImageToJpegDataUrl";

export function usePdfImage(url?: string): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDataUrl(null);

    if (!url) {
      return;
    }

    remoteImageToJpegDataUrl(url).then((result) => {
      if (!cancelled) {
        setDataUrl(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return dataUrl;
}
