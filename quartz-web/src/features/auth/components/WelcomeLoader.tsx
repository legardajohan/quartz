import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import '../../../components/common/rainbow-fill.css';
import './WelcomeLoader.css';

export interface WelcomeLoaderProps {
  tagline?: string;
  durationMs?: number;
  onComplete?: () => void;
}

const DEFAULT_TAGLINE = 'Preparando tu entorno…';
const DEFAULT_DURATION_MS = 2200;
// Debe coincidir con la duración de la animación `quartzWelcome-fadeOut` en WelcomeLoader.css.
const FADE_OUT_MS = 320;

export function WelcomeLoader({
  tagline = DEFAULT_TAGLINE,
  durationMs = DEFAULT_DURATION_MS,
  onComplete,
}: WelcomeLoaderProps): React.ReactElement {
  useEffect(() => {
    const timer = setTimeout(() => onComplete?.(), durationMs + FADE_OUT_MS);
    return () => clearTimeout(timer);
  }, [durationMs, onComplete]);

  const style: CSSProperties & Record<string, string> = {
    '--quartz-welcome-duration': `${durationMs}ms`,
  };

  return (
    <div id="quartz-loader-wrapper" style={style}>
      <div className="boot-overlay">
        <div className="boot-overlay__logo" role="img" aria-label="Quartz">
          <div className="boot-overlay__aura quartz-rainbow-fill" aria-hidden="true" />
          <div className="boot-overlay__fill quartz-rainbow-fill" aria-hidden="true" />
          <div className="boot-overlay__sheen" />
        </div>
        <p className="boot-overlay__tagline">{tagline}</p>
        <div className="boot-overlay__progress">
          <span />
        </div>
      </div>
    </div>
  );
}
