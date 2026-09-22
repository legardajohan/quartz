import { useSearchParams } from "react-router-dom";
import { Button, Typography } from "@material-tailwind/react";
import toast from "react-hot-toast";
import { extractErrorMessage } from "@/api/apiClient";
import { Skeleton } from "@/components/ui/Skeleton";
import { usePermissions } from "@/features/auth/usePermissions";
import { useSchoolsQuery } from "@/features/users/queries/useSchoolsQuery";
import ProfileForm from "../components/ProfileForm";
import ChangePasswordForm from "../components/ChangePasswordForm";
import {
  useChangeOwnPasswordMutation,
  useOwnProfileQuery,
  useUpdateOwnProfileMutation,
  useUploadOwnPhotoMutation,
} from "../queries/useAccountQuery";
import type { ChangeOwnPassword, UpdateOwnProfile } from "../types";

// Cada sección se abre desde el menú de usuario (`?tab=`); la página no tiene navegación propia.
const ACCOUNT_SECTIONS = {
  perfil: {
    title: "Mi perfil",
    description: "Revisa y actualiza tus datos personales y tu foto.",
  },
  contrasena: {
    title: "Cambiar contraseña",
    description: "Escribe tu contraseña actual y luego la nueva dos veces. Seguirás con la sesión abierta en este equipo.",
  },
} as const;

type AccountSection = keyof typeof ACCOUNT_SECTIONS;

function parseSection(value: string | null): AccountSection {
  return value === "contrasena" ? "contrasena" : "perfil";
}

function ProfileSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[15rem_1fr]" aria-busy="true" aria-label="Cargando tu perfil">
      <div className="flex flex-col items-center gap-4 lg:items-start">
        <Skeleton className="h-32 w-32 rounded-full" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="space-y-6">
        {[0, 1, 2].map((row) => (
          <div key={row} className="grid gap-4 md:grid-cols-[12rem_1fr]">
            <Skeleton className="h-4 w-28" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileSection() {
  const { isAreaLead } = usePermissions();
  const profileQuery = useOwnProfileQuery();
  const schoolsQuery = useSchoolsQuery({ enabled: isAreaLead });
  const updateProfile = useUpdateOwnProfileMutation();
  const uploadPhoto = useUploadOwnPhotoMutation();

  const handleProfileSubmit = async (payload: UpdateOwnProfile) => {
    try {
      await updateProfile.mutateAsync(payload);
      toast.success("Perfil actualizado.");
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, "No se pudo actualizar tu perfil."));
    }
  };

  const handlePhotoUpload = async (blob: Blob) => {
    try {
      await uploadPhoto.mutateAsync(blob);
      toast.success("Foto actualizada.");
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, "No se pudo subir tu foto."));
    }
  };

  if (profileQuery.isPending) return <ProfileSkeleton />;

  if (profileQuery.isError) {
    return (
      <div className="flex max-w-md flex-col items-start gap-4">
        <Typography className="text-gray-700">
          {extractErrorMessage(profileQuery.error, "No pudimos cargar tus datos.")}
        </Typography>
        <Button
          variant="outlined"
          color="purple"
          size="sm"
          onClick={() => void profileQuery.refetch()}
          className="transition-transform duration-150 active:scale-[0.97]"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <ProfileForm
      profile={profileQuery.data}
      isAreaLead={isAreaLead}
      schools={schoolsQuery.data ?? []}
      onSubmit={handleProfileSubmit}
      onUploadPhoto={handlePhotoUpload}
      isSubmitting={updateProfile.isPending}
      isUploading={uploadPhoto.isPending}
    />
  );
}

function PasswordSection() {
  const changePassword = useChangeOwnPasswordMutation();

  const handlePasswordSubmit = async (data: ChangeOwnPassword): Promise<boolean> => {
    try {
      await changePassword.mutateAsync(data);
      toast.success("Contraseña actualizada.");
      return true;
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, "No se pudo cambiar tu contraseña."));
      return false;
    }
  };

  return <ChangePasswordForm onSubmit={handlePasswordSubmit} isSubmitting={changePassword.isPending} />;
}

export default function AccountPage() {
  const [searchParams] = useSearchParams();
  const section = parseSection(searchParams.get("tab"));
  const { title, description } = ACCOUNT_SECTIONS[section];

  return (
    <div className="w-full">
      <div className="mb-8">
        <Typography variant="h4" color="blue-gray" className="font-bold">
          {title}
        </Typography>
        <Typography variant="small" className="text-gray-600">
          {description}
        </Typography>
      </div>

      {section === "perfil" ? <ProfileSection /> : <PasswordSection />}
    </div>
  );
}
