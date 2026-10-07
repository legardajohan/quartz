import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Input } from "@material-tailwind/react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui";
import PasswordField from "@/components/common/PasswordField";
import PasswordRequirements from "@/components/common/PasswordRequirements";
import { isStrongPassword } from "@/utils/passwordPolicy";

export interface NewPasswordFormValues {
  password: string;
  confirmPassword: string;
}

export interface NewPasswordFormProps {
  email: string;
  heading: string;
  subtitle: ReactNode;
  submitLabel: string;
  loadingText: string;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (values: NewPasswordFormValues) => void;
}

// Crear contraseña desde un enlace de un solo uso (activación de cuenta y recuperación).
export default function NewPasswordForm({
  email,
  heading,
  subtitle,
  submitLabel,
  loadingText,
  isSubmitting,
  error,
  onSubmit,
}: NewPasswordFormProps) {
  const [values, setValues] = useState<NewPasswordFormValues>({ password: "", confirmPassword: "" });
  const [visible, setVisible] = useState({ password: false, confirmPassword: false });
  const [showErrors, setShowErrors] = useState(false);

  const isStrong = isStrongPassword(values.password);
  const matches = values.confirmPassword.length > 0 && values.password === values.confirmPassword;
  const isValid = isStrong && matches;

  const update = (key: keyof NewPasswordFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const toggle = (key: keyof NewPasswordFormValues) => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValid) {
      setShowErrors(true);
      return;
    }
    onSubmit(values);
  };

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-10 text-center">
        <h1 className="mb-4 text-4xl font-bold text-purple-800 [text-wrap:balance]">{heading}</h1>
        <div className="mx-auto mb-6 h-1 w-[120px] bg-pink-500" />
        <p className="text-lg text-gray-800 [text-wrap:pretty]">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <Input
          color="purple"
          label="Correo"
          value={email}
          readOnly
          aria-readonly
          autoComplete="username"
          crossOrigin="anonymous"
          className="cursor-default text-gray-700"
          icon={<Lock className="h-4 w-4 text-gray-400" aria-hidden />}
        />

        <PasswordField
          label="Contraseña"
          value={values.password}
          onChange={(value) => update("password", value)}
          autoComplete="new-password"
          isVisible={visible.password}
          onToggleVisibility={() => toggle("password")}
          error={showErrors && !isStrong}
          disabled={isSubmitting}
        />
        <PasswordField
          label="Repite la contraseña"
          value={values.confirmPassword}
          onChange={(value) => update("confirmPassword", value)}
          autoComplete="new-password"
          isVisible={visible.confirmPassword}
          onToggleVisibility={() => toggle("confirmPassword")}
          error={showErrors && !matches}
          disabled={isSubmitting}
        />

        <PasswordRequirements
          password={values.password}
          extra={[{ met: matches, label: "Las dos contraseñas coinciden" }]}
        />

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3" role="alert">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          isLoading={isSubmitting}
          loadingText={loadingText}
          disabled={isSubmitting}
          className="active:scale-[0.97]"
        >
          {submitLabel}
        </Button>
      </form>
    </div>
  );
}
