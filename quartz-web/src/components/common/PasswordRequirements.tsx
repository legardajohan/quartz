import { Check, Circle } from "lucide-react";
import { PASSWORD_RULES } from "@/utils/passwordPolicy";

export interface PasswordRequirementProps {
  met: boolean;
  label: string;
}

export function PasswordRequirement({ met, label }: PasswordRequirementProps) {
  const Icon = met ? Check : Circle;
  return (
    <li className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${met ? "text-green-700" : "text-gray-600"}`}>
      <Icon className={`h-3 w-3 shrink-0 ${met ? "" : "scale-75"}`} strokeWidth={met ? 3 : 2} aria-hidden />
      <span>{label}</span>
      <span className="sr-only">{met ? "(cumplido)" : "(pendiente)"}</span>
    </li>
  );
}

export interface PasswordRequirementsProps {
  password: string;
  /** Requisitos propios del formulario (p. ej. "Las contraseñas coinciden"), tras los de la política. */
  extra?: PasswordRequirementProps[];
}

// Checklist en vivo de la política de contraseña (`PASSWORD_RULES`) + requisitos del formulario.
export default function PasswordRequirements({ password, extra = [] }: PasswordRequirementsProps) {
  return (
    <ul className="grid grid-cols-1 gap-x-4 gap-y-0.5 sm:grid-cols-2" aria-live="polite">
      {PASSWORD_RULES.map((rule) => (
        <PasswordRequirement key={rule.id} met={rule.test(password)} label={rule.label} />
      ))}
      {extra.map((item) => (
        <PasswordRequirement key={item.label} met={item.met} label={item.label} />
      ))}
    </ul>
  );
}
