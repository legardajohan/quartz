import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/api/apiClient";
import { blobToDataUrl } from "@/utils/blobToDataUrl";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { useInstitutionStore } from "../useInstitutionStore";
import { readShieldFromCache, writeShieldToCache } from "../shieldCache";

export interface InstitutionShieldResult {
  src: string | null;
  isLoading: boolean;
}

export function useInstitutionShieldQuery(): InstitutionShieldResult {
  const institutionId = useAuthStore((state) => state.sessionData?.user.institutionId);
  const shieldVersion = useInstitutionStore((state) => state.branding?.shieldVersion);

  const { data, isLoading } = useQuery({
    queryKey: ["institution-shield", institutionId, shieldVersion],
    enabled: !!institutionId && !!shieldVersion,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
    initialData: () =>
      institutionId && shieldVersion ? readShieldFromCache(institutionId, shieldVersion) : undefined,
    queryFn: async () => {
      const blob = await apiGet<Blob>("/institutions/me/shield.jpg", { responseType: "blob" });
      const dataUrl = await blobToDataUrl(blob);
      writeShieldToCache(institutionId!, shieldVersion!, dataUrl);
      return dataUrl;
    },
  });

  if (!institutionId || !shieldVersion) {
    return { src: null, isLoading: false };
  }

  return { src: data ?? null, isLoading };
}
