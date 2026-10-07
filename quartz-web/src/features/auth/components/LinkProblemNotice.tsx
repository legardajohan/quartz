import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui";

export interface LinkProblemNoticeProps {
  icon: LucideIcon;
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}

// Enlace de un solo uso no válido o vencido (activación y recuperación de contraseña).
export default function LinkProblemNotice({ icon: Icon, title, body, actionLabel, onAction }: LinkProblemNoticeProps) {
  return (
    <div className="w-full max-w-[400px] text-center">
      <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 text-purple-700">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="mb-4 text-3xl font-bold text-purple-800 [text-wrap:balance]">{title}</h1>
      <div className="mx-auto mb-6 h-1 w-[120px] bg-pink-500" />
      <p className="mb-10 text-base leading-relaxed text-gray-700 [text-wrap:pretty]">{body}</p>
      <Button variant="secondary" onClick={onAction} className="active:scale-[0.97]">
        {actionLabel}
      </Button>
    </div>
  );
}
