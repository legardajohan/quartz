import { useState } from "react";
import type { FormEvent } from "react";
import { Button, Input } from "@material-tailwind/react";
import { Check, Circle, Eye, EyeOff } from "lucide-react";
import type { ChangeOwnPassword } from "../types";

const MIN_PASSWORD_LENGTH = 8;

const EMPTY_FORM: ChangeOwnPassword = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  isVisible: boolean;
  onToggleVisibility: () => void;
  error?: boolean;
}

function PasswordField({ label, value, onChange, autoComplete, isVisible, onToggleVisibility, error }: PasswordFieldProps) {
  const ToggleIcon = isVisible ? EyeOff : Eye;
  return (
    <Input
      color="purple"
      type={isVisible ? "text" : "password"}
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete={autoComplete}
      error={error}
      crossOrigin="anonymous"
      icon={
        <button
          type="button"
          onClick={onToggleVisibility}
          aria-label={isVisible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          aria-pressed={isVisible}
          className="-m-1.5 rounded-md p-1.5 text-gray-500 transition-colors duration-150 hover:text-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-500"
        >
          <ToggleIcon className="h-4 w-4" aria-hidden />
        </button>
      }
    />
  );
}

interface RequirementProps {
  met: boolean;
  label: string;
}

function Requirement({ met, label }: RequirementProps) {
  const Icon = met ? Check : Circle;
  return (
    <li className={`flex items-center gap-2 text-sm transition-colors duration-200 ${met ? "text-green-700" : "text-gray-600"}`}>
      <Icon className={`h-3.5 w-3.5 shrink-0 ${met ? "" : "scale-75"}`} strokeWidth={met ? 3 : 2} aria-hidden />
      <span>{label}</span>
      <span className="sr-only">{met ? "(cumplido)" : "(pendiente)"}</span>
    </li>
  );
}

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

  const hasMinLength = formData.newPassword.length >= MIN_PASSWORD_LENGTH;
  const isDifferent = formData.newPassword.length > 0 && formData.newPassword !== formData.currentPassword;
  const matches = formData.confirmPassword.length > 0 && formData.newPassword === formData.confirmPassword;
  const isValid = formData.currentPassword.length > 0 && hasMinLength && isDifferent && matches;

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
            error={showErrors && (!hasMinLength || !isDifferent)}
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

        <ul className="space-y-1.5" aria-live="polite">
          <Requirement met={hasMinLength} label={`Al menos ${MIN_PASSWORD_LENGTH} caracteres`} />
          <Requirement met={isDifferent} label="Distinta de la contraseña actual" />
          <Requirement met={matches} label="Las dos contraseñas nuevas coinciden" />
        </ul>
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
