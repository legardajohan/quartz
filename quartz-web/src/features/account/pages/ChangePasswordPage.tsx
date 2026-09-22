import toast from "react-hot-toast";
import { extractErrorMessage } from "@/api/apiClient";
import AccountPageHeader from "../components/AccountPageHeader";
import ChangePasswordForm from "../components/ChangePasswordForm";
import { useChangeOwnPasswordMutation } from "../queries/useAccountQuery";
import type { ChangeOwnPassword } from "../types";

export default function ChangePasswordPage() {
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

  return (
    <div className="w-full">
      <AccountPageHeader
        title="Cambiar contraseña"
        description="Escribe tu contraseña actual y luego la nueva dos veces. Seguirás con la sesión abierta en este equipo."
      />
      <ChangePasswordForm onSubmit={handlePasswordSubmit} isSubmitting={changePassword.isPending} />
    </div>
  );
}
