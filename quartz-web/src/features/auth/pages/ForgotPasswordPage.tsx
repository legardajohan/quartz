import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { extractErrorMessage } from "@/api/apiClient";
import { Button } from "@/components/ui";
import { useRequestPasswordResetMutation } from "../queries/usePasswordResetQuery";
import AuthShell from "../components/AuthShell";
import ForgotPasswordForm from "../components/ForgotPasswordForm";
import type { AuthLocationState } from "../types";

interface ResetLinkSentNoticeProps {
  email: string;
  onBackToLogin: () => void;
  onUseAnotherEmail: () => void;
}

// Mensaje genérico a propósito: la API no revela si el correo está registrado.
function ResetLinkSentNotice({ email, onBackToLogin, onUseAnotherEmail }: ResetLinkSentNoticeProps) {
  return (
    <div className="w-full max-w-[400px] text-center" role="status">
      <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 text-purple-700">
        <MailCheck className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="mb-4 text-3xl font-bold text-purple-800 [text-wrap:balance]">Revisa tu correo</h1>
      <div className="mx-auto mb-6 h-1 w-[120px] bg-pink-500" />
      <p className="mb-4 text-base leading-relaxed text-gray-700 [text-wrap:pretty]">
        Si <span className="font-semibold break-all">{email}</span> tiene una cuenta en Quartz, te enviamos un enlace
        para crear una contraseña nueva. El enlace vence en 1 hora.
      </p>
      <p className="mb-10 text-sm leading-relaxed text-gray-600 [text-wrap:pretty]">
        ¿No llegó? Revisa la carpeta de spam o vuelve a intentarlo en un minuto.
      </p>
      <Button variant="secondary" onClick={onBackToLogin} className="active:scale-[0.97]">
        Volver a iniciar sesión
      </Button>
      <button
        type="button"
        onClick={onUseAnotherEmail}
        className="mt-6 text-sm font-semibold text-pink-600 transition-colors hover:text-pink-700 focus:underline focus:outline-none"
      >
        Usar otro correo
      </button>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = (location.state as AuthLocationState | null)?.email ?? "";

  const requestReset = useRequestPasswordResetMutation();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [lastEmail, setLastEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);

  const goToLogin = () => {
    const state: AuthLocationState = { email: sentTo ?? lastEmail };
    navigate("/login", { replace: true, state });
  };

  const handleSubmit = async (email: string) => {
    setError(null);
    setLastEmail(email);
    try {
      await requestReset.mutateAsync({ email });
      setSentTo(email);
    } catch (err) {
      setError(extractErrorMessage(err, "No se pudo enviar el enlace. Inténtalo de nuevo."));
    }
  };

  return (
    <AuthShell>
      {sentTo ? (
        <ResetLinkSentNotice email={sentTo} onBackToLogin={goToLogin} onUseAnotherEmail={() => setSentTo(null)} />
      ) : (
        <ForgotPasswordForm
          initialEmail={lastEmail}
          isSubmitting={requestReset.isPending}
          error={error}
          onSubmit={handleSubmit}
          onBackToLogin={goToLogin}
        />
      )}
    </AuthShell>
  );
}
