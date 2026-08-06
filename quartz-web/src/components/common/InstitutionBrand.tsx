import { useEffect, useState } from 'react';
import { BuildingLibraryIcon } from '@heroicons/react/24/solid';
import { useInstitutionStore } from '../../features/institution/useInstitutionStore';

export function InstitutionBrand(): React.ReactElement {
  const branding = useInstitutionStore((state) => state.branding);
  const fetchBranding = useInstitutionStore((state) => state.fetchBranding);
  const [shieldFailed, setShieldFailed] = useState(false);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  useEffect(() => {
    setShieldFailed(false);
  }, [branding?.shieldUrl]);

  const showShield = !!branding?.shieldUrl && !shieldFailed;

  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="h-11 w-11 shrink-0 rounded-full overflow-hidden bg-white/10 ring-1 ring-white/20 flex items-center justify-center">
        {showShield ? (
          <img
            src={branding!.shieldUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setShieldFailed(true)}
          />
        ) : (
          <BuildingLibraryIcon className="h-6 w-6 text-purple-300" />
        )}
      </div>
      <div className="flex flex-col leading-tight min-w-0">
        <span className="text-[10px] uppercase tracking-wide text-purple-300/70 font-medium">
          Institución Educativa
        </span>
        <span className="text-base text-white font-semibold truncate">
          {branding?.name ?? 'Cargando…'}
        </span>
      </div>
    </div>
  );
}
