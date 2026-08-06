import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { School } from 'lucide-react';
import { useInstitutionStore } from '../../features/institution/useInstitutionStore';

export interface InstitutionBrandProps {
  tone?: 'dark' | 'light';
}

const TONE_STYLES = {
  dark: {
    avatar: 'bg-white/10 ring-1 ring-white/20',
    icon: 'text-purple-300',
    eyebrow: 'text-purple-300/70',
    name: 'text-white',
    nameSize: 'text-sm',
    loading: 'text-white/70',
    maxWidth: 'max-w-[190px]',
  },
  light: {
    avatar: 'bg-purple-50 ring-1 ring-purple-100',
    icon: 'text-purple-400',
    eyebrow: 'text-slate-500',
    name: 'text-purple-950',
    nameSize: 'text-base',
    loading: 'text-purple-950/60',
    maxWidth: 'max-w-[280px]',
  },
} as const;

export function InstitutionBrand({ tone = 'dark' }: InstitutionBrandProps): React.ReactElement {
  const branding = useInstitutionStore((state) => state.branding);
  const fetchBranding = useInstitutionStore((state) => state.fetchBranding);
  const [shieldFailed, setShieldFailed] = useState(false);
  const [topWordCount, setTopWordCount] = useState(1);
  const textRef = useRef<HTMLDivElement>(null);
  const measurerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  useEffect(() => {
    setShieldFailed(false);
  }, [branding?.shieldUrl]);

  const showShield = !!branding?.shieldUrl && !shieldFailed;
  const styles = TONE_STYLES[tone];

  const nameParts = branding?.name?.trim().split(/\s+/).filter(Boolean) ?? [];
  const hasEyebrow = nameParts.length > 1;
  // Al menos una palabra siempre queda para el renglón principal.
  const maxTopWords = nameParts.length - 1;

  useLayoutEffect(() => {
    if (!hasEyebrow) return;

    if (tone === 'light') {
      // Menú superior: siempre las 2 primeras palabras (típicamente el prefijo
      // genérico "Institución Educativa"/"Colegio"), sin medir ancho.
      setTopWordCount(Math.min(2, maxTopWords));
      return;
    }

    const container = textRef.current;
    const measurer = measurerRef.current;
    if (!container || !measurer) return;

    const availableWidth = container.getBoundingClientRect().width;
    let fitCount = 1;
    for (let i = 1; i <= maxTopWords; i++) {
      measurer.textContent = nameParts.slice(0, i).join(' ');
      if (measurer.getBoundingClientRect().width > availableWidth) break;
      fitCount = i;
    }
    setTopWordCount(fitCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasEyebrow, tone, branding?.name]);

  const topName = hasEyebrow ? nameParts.slice(0, topWordCount).join(' ') : '';
  const restName = hasEyebrow ? nameParts.slice(topWordCount).join(' ') : branding?.name;

  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className={`h-11 w-11 shrink-0 rounded-full overflow-hidden flex items-center justify-center ${styles.avatar}`}>
        {showShield ? (
          <img
            src={branding!.shieldUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setShieldFailed(true)}
          />
        ) : (
          <School className={`h-6 w-6 ${styles.icon}`} strokeWidth={1.75} />
        )}
      </div>
      <div ref={textRef} className={`flex flex-col leading-tight min-w-0 ${styles.maxWidth}`}>
        <span ref={measurerRef} aria-hidden="true" className="text-[10px] uppercase tracking-wide font-medium absolute -left-[9999px] -top-[9999px] whitespace-nowrap">
          {topName}
        </span>
        {topName && (
          <span className={`text-[10px] uppercase tracking-wide font-medium truncate ${styles.eyebrow}`}>
            {topName}
          </span>
        )}
        <span className={`${styles.nameSize} font-semibold truncate ${restName ? styles.name : styles.loading}`}>
          {restName ?? 'Cargando…'}
        </span>
      </div>
    </div>
  );
}
