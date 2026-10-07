import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Clock, Link2Off } from "lucide-react";
import { extractErrorMessage, isAxiosError } from "@/api/apiClient";
import { Loading } from "@/components/ui/Loading";
import { useResetPasswordMutation, useVerifyPasswordResetQuery } from "../queries/usePasswordResetQuery";
import AuthShell from "../components/AuthShell";
import LinkProblemNotice from "../components/LinkProblemNotice";
import NewPasswordForm, { type NewPasswordFormValues } from "../components/NewPasswordForm";
import type { AuthLocationState } from "../types";

type LinkProblem = "invalid" | "expired";

const PASSWORD_UPDATED_NOTICE = "Tu contraseña se actualizó. Inicia sesión con la nueva.";

// 410 = vencido; cualquier otro fallo del token se trata como enlace no válido.
function toLinkProblem(error: unknown): LinkProblem {
  return isAxiosError(error) && error.response?.status === 410 ? "expired" : "invalid";
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const { data: preview, isLoading, error: verifyError } = useVerifyPasswordResetQuery(token);
  const resetPassword = useResetPasswordMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Un 404/410 al enviar (otra pestaña ya lo usó, o venció mientras escribía) cambia la pantalla.
  const [submitProblem, setSubmitProblem] = useState<LinkProblem | null>(null);

  const goToLogin = () => navigate("/login", { replace: true });
  const goToForgotPassword = () =>
    navigate("/recuperar-contrasena", { replace: true, state: { email: preview?.email } satisfies AuthLocationState });

  const renderProblem = (problem: LinkProblem) =>
    problem === "expired" ? (
      <LinkProblemNotice
        icon={Clock}
        title="Este enlace expiró"
        body="Los enlaces para restablecer la contraseña duran 1 hora. Solicita uno nuevo y úsalo apenas te llegue."
        actionLabel="Solicitar un enlace nuevo"
        onAction={goToForgotPassword}
      />
    ) : (
      <LinkProblemNotice
        icon={Link2Off}
        title="Este enlace no es válido"
        body="Puede que ya lo hayas usado, que esté incompleto o que pidieras uno más reciente. Usa el último enlace que te enviamos o solicita uno nuevo desde el inicio de sesión."
        actionLabel="Ir a iniciar sesión"
        onAction={goToLogin}
      />
    );

  const handleSubmit = async ({ password, confirmPassword }: NewPasswordFormValues) => {
    if (!token || !preview) return;
    setSubmitError(null);
    try {
      await resetPassword.mutateAsync({ token, password, confirmPassword });
      const state: AuthLocationState = { notice: PASSWORD_UPDATED_NOTICE, email: preview.email };
      navigate("/login", { replace: true, state });
    } catch (err) {
      const status = isAxiosError(err) ? err.response?.status : undefined;
      if (status === 404 || status === 410) {
        setSubmitProblem(toLinkProblem(err));
      } else {
        setSubmitError(extractErrorMessage(err, "No se pudo guardar la contraseña. Inténtalo de nuevo."));
      }
    }
  };

  let content: ReactNode;
  if (!token) {
    content = renderProblem("invalid");
  } else if (submitProblem) {
    content = renderProblem(submitProblem);
  } else if (isLoading) {
    content = <Loading />;
  } else if (verifyError || !preview) {
    content = renderProblem(toLinkProblem(verifyError));
  } else {
    content = (
      <NewPasswordForm
        email={preview.email}
        heading={`Hola, ${preview.firstName}`}
        subtitle="Crea una contraseña nueva para tu cuenta de Quartz."
        submitLabel="Guardar contraseña"
        loadingText="Guardando…"
        isSubmitting={resetPassword.isPending}
        error={submitError}
        onSubmit={handleSubmit}
      />
    );
  }

  return <AuthShell>{content}</AuthShell>;
}
