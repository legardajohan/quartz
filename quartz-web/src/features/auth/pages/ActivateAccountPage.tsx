import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Clock, Link2Off } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { extractErrorMessage, isAxiosError } from "@/api/apiClient";
import { Loading } from "@/components/ui/Loading";
import { useAuthStore } from "../useAuthStore";
import { useVerifyActivationQuery } from "../queries/useActivationQuery";
import AuthShell from "../components/AuthShell";
import LinkProblemNotice from "../components/LinkProblemNotice";
import ActivateAccountForm, { type ActivateAccountFormValues } from "../components/ActivateAccountForm";

type LinkProblem = "invalid" | "expired";

const LINK_PROBLEMS: Record<LinkProblem, { icon: LucideIcon; title: string; body: string }> = {
  invalid: {
    icon: Link2Off,
    title: "Este enlace no es válido",
    body: "Puede que ya lo hayas usado o que esté incompleto. Si ya activaste tu cuenta, inicia sesión con tu correo y contraseña.",
  },
  expired: {
    icon: Clock,
    title: "Este enlace expiró",
    body: "Los enlaces de activación duran 15 días. Pide a tu Jefe de Área que te envíe uno nuevo.",
  },
};

// 410 = vencido; cualquier otro fallo del token se trata como enlace no válido.
function toLinkProblem(error: unknown): LinkProblem {
  return isAxiosError(error) && error.response?.status === 410 ? "expired" : "invalid";
}

export default function ActivateAccountPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const activateAccount = useAuthStore((state) => state.activateAccount);

  const { data: preview, isLoading, error: verifyError } = useVerifyActivationQuery(token);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Un 404/410 al enviar (otra pestaña ya lo usó, o venció mientras escribía) cambia la pantalla.
  const [submitProblem, setSubmitProblem] = useState<LinkProblem | null>(null);

  const goToLogin = () => navigate("/login", { replace: true });

  const renderProblem = (problem: LinkProblem) => (
    <LinkProblemNotice {...LINK_PROBLEMS[problem]} actionLabel="Ir a iniciar sesión" onAction={goToLogin} />
  );

  const handleSubmit = async ({ password, confirmPassword }: ActivateAccountFormValues) => {
    if (!token) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await activateAccount({ token, password, confirmPassword });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const status = isAxiosError(err) ? err.response?.status : undefined;
      if (status === 404 || status === 410) {
        setSubmitProblem(toLinkProblem(err));
      } else {
        setSubmitError(extractErrorMessage(err, "No se pudo activar la cuenta. Inténtalo de nuevo."));
      }
      setIsSubmitting(false);
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
      <ActivateAccountForm preview={preview} isSubmitting={isSubmitting} error={submitError} onSubmit={handleSubmit} />
    );
  }

  return <AuthShell>{content}</AuthShell>;
}
