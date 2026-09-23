import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Clock, Link2Off } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { extractErrorMessage, isAxiosError } from "@/api/apiClient";
import { Button } from "@/components/ui";
import { Loading } from "@/components/ui/Loading";
import { useAuthStore } from "../useAuthStore";
import { useVerifyActivationQuery } from "../queries/useActivationQuery";
import { PresentationPanel } from "../components/PresentationPanel";
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

function LinkProblemNotice({ problem, onGoToLogin }: { problem: LinkProblem; onGoToLogin: () => void }) {
  const { icon: Icon, title, body } = LINK_PROBLEMS[problem];
  return (
    <div className="w-full max-w-[400px] text-center">
      <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 text-purple-700">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="mb-4 text-3xl font-bold text-purple-800 [text-wrap:balance]">{title}</h1>
      <div className="mx-auto mb-6 h-1 w-[120px] bg-pink-500" />
      <p className="mb-10 text-base leading-relaxed text-gray-700 [text-wrap:pretty]">{body}</p>
      <Button variant="secondary" onClick={onGoToLogin} className="active:scale-[0.97]">
        Ir a iniciar sesión
      </Button>
    </div>
  );
}

function ActivationShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="flex min-h-[600px] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white/90 shadow-2xl md:flex-row">
        <PresentationPanel />
        <div className="flex flex-1 items-center justify-center bg-white p-10">{children}</div>
      </div>
    </div>
  );
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
    content = <LinkProblemNotice problem="invalid" onGoToLogin={goToLogin} />;
  } else if (submitProblem) {
    content = <LinkProblemNotice problem={submitProblem} onGoToLogin={goToLogin} />;
  } else if (isLoading) {
    content = <Loading />;
  } else if (verifyError || !preview) {
    content = <LinkProblemNotice problem={toLinkProblem(verifyError)} onGoToLogin={goToLogin} />;
  } else {
    content = (
      <ActivateAccountForm preview={preview} isSubmitting={isSubmitting} error={submitError} onSubmit={handleSubmit} />
    );
  }

  return <ActivationShell>{content}</ActivationShell>;
}
