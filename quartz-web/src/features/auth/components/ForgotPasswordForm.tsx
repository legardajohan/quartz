import { useState } from "react";
import type { FormEvent } from "react";
import { Button, Input } from "@material-tailwind/react";

export interface ForgotPasswordFormProps {
  initialEmail: string;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (email: string) => void;
  onBackToLogin: () => void;
}

export default function ForgotPasswordForm({
  initialEmail,
  isSubmitting,
  error,
  onSubmit,
  onBackToLogin,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const trimmedEmail = email.trim();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (trimmedEmail) onSubmit(trimmedEmail);
  };

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-10 text-center">
        <h1 className="mb-4 text-4xl font-bold text-purple-800 [text-wrap:balance]">Recupera tu contraseña</h1>
        <div className="mx-auto mb-6 h-1 w-[120px] bg-pink-500" />
        <p className="text-base text-gray-800 [text-wrap:pretty]">
          Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          color="purple"
          label="Correo"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          crossOrigin="anonymous"
          required
          autoFocus
          disabled={isSubmitting}
        />

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3" role="alert">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          variant="gradient"
          color="purple"
          fullWidth
          loading={isSubmitting}
          disabled={isSubmitting || !trimmedEmail}
          className="transition-transform duration-150 active:scale-[0.97]"
        >
          {isSubmitting ? "Enviando…" : "Enviar enlace"}
        </Button>

        <div className="text-center text-sm text-gray-500">
          ¿La recordaste?{" "}
          <button
            type="button"
            onClick={onBackToLogin}
            className="font-semibold text-pink-600 transition-colors hover:text-pink-700 focus:underline focus:outline-none"
            disabled={isSubmitting}
          >
            Volver a iniciar sesión
          </button>
        </div>
      </form>
    </div>
  );
}
