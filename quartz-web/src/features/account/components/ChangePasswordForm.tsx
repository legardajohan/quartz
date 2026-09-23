import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@material-tailwind/react";
import PasswordField from "@/components/common/PasswordField";
import PasswordRequirements from "@/components/common/PasswordRequirements";
import { isStrongPassword } from "@/utils/passwordPolicy";
import type { ChangeOwnPassword } from "../types";

const EMPTY_FORM: ChangeOwnPassword = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export interface ChangePasswordFormProps {
  /** Devuelve `true` si el cambio se aplicó; el formulario se limpia solo en ese caso. */
  onSubmit: (data: ChangeOwnPassword) => Promise<boolean>;
  isSubmitting: boolean;
}

export default function ChangePasswordForm({ onSubmit, isSubmitting }: ChangePasswordFormProps) {
  const [formData, setFormData] = useState<ChangeOwnPassword>(EMPTY_FORM);
  const [visibleFields, setVisibleFields] = useState<Record<keyof ChangeOwnPassword, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [showErrors, setShowErrors] = useState(false);

  const isStrong = isStrongPassword(formData.newPassword);
  const isDifferent = formData.newPassword.length > 0 && formData.newPassword !== formData.currentPassword;
  const matches = formData.confirmPassword.length > 0 && formData.newPassword === formData.confirmPassword;
  const isValid = formData.currentPassword.length > 0 && isStrong && isDifferent && matches;

  const update = (key: keyof ChangeOwnPassword, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleVisibility = (key: keyof ChangeOwnPassword) => {
    setVisibleFields((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValid) {
      setShowErrors(true);
      return;
    }
    const succeeded = await onSubmit(formData);
    if (succeeded) {
      setFormData(EMPTY_FORM);
      setShowErrors(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-md space-y-6">
      <div className="space-y-5">
        <PasswordField
          label="Contraseña actual"
          value={formData.currentPassword}
          onChange={(value) => update("currentPassword", value)}
          autoComplete="current-password"
          isVisible={visibleFields.currentPassword}
          onToggleVisibility={() => toggleVisibility("currentPassword")}
          error={showErrors && formData.currentPassword.length === 0}
        />

        <div className="space-y-5 border-t border-gray-100 pt-5">
          <PasswordField
            label="Nueva contraseña"
            value={formData.newPassword}
            onChange={(value) => update("newPassword", value)}
            autoComplete="new-password"
            isVisible={visibleFields.newPassword}
            onToggleVisibility={() => toggleVisibility("newPassword")}
            error={showErrors && (!isStrong || !isDifferent)}
          />
          <PasswordField
            label="Repite la nueva contraseña"
            value={formData.confirmPassword}
            onChange={(value) => update("confirmPassword", value)}
            autoComplete="new-password"
            isVisible={visibleFields.confirmPassword}
            onToggleVisibility={() => toggleVisibility("confirmPassword")}
            error={showErrors && !matches}
          />
        </div>

        <PasswordRequirements
          password={formData.newPassword}
          extra={[
            { met: isDifferent, label: "Distinta de la contraseña actual" },
            { met: matches, label: "Las dos contraseñas nuevas coinciden" },
          ]}
        />
      </div>

      <div className="flex justify-end border-t border-gray-100 pt-6">
        <Button
          type="submit"
          variant="gradient"
          color="purple"
          disabled={isSubmitting}
          loading={isSubmitting}
          className="flex w-full items-center justify-center transition-transform duration-150 active:scale-[0.97] sm:w-auto"
        >
          {isSubmitting ? "Actualizando…" : "Cambiar contraseña"}
        </Button>
      </div>
    </form>
  );
}
