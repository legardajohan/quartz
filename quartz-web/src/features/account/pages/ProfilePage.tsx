import { Button, Typography } from "@material-tailwind/react";
import toast from "react-hot-toast";
import { extractErrorMessage } from "@/api/apiClient";
import { Skeleton } from "@/components/ui/Skeleton";
import { usePermissions } from "@/features/auth/usePermissions";
import { useSchoolsQuery } from "@/features/users/queries/useSchoolsQuery";
import AccountPageHeader from "../components/AccountPageHeader";
import ProfileForm from "../components/ProfileForm";
import {
  useOwnProfileQuery,
  useUpdateOwnProfileMutation,
  useUploadOwnPhotoMutation,
} from "../queries/useAccountQuery";
import type { UpdateOwnProfile } from "../types";

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

export default function ProfilePage() {
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

  const renderContent = () => {
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
  };

  return (
    <div className="w-full">
      <AccountPageHeader title="Mi perfil" description="Revisa y actualiza tus datos personales y tu foto." />
      {renderContent()}
    </div>
  );
}
