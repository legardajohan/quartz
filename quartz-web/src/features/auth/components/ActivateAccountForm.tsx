import NewPasswordForm, { type NewPasswordFormValues } from "./NewPasswordForm";
import type { ActivationPreview } from "../types";

export type ActivateAccountFormValues = NewPasswordFormValues;

export interface ActivateAccountFormProps {
  preview: ActivationPreview;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (values: ActivateAccountFormValues) => void;
}

export default function ActivateAccountForm({ preview, isSubmitting, error, onSubmit }: ActivateAccountFormProps) {
  return (
    <NewPasswordForm
      email={preview.email}
      heading={`Hola, ${preview.firstName}`}
      subtitle={
        <>
          Crea tu contraseña para entrar a Quartz
          {preview.institutionName && (
            <>
              {" "}en <span className="font-semibold">{preview.institutionName}</span>
            </>
          )}
          .
        </>
      }
      submitLabel="Activar mi cuenta"
      loadingText="Activando…"
      isSubmitting={isSubmitting}
      error={error}
      onSubmit={onSubmit}
    />
  );
}
