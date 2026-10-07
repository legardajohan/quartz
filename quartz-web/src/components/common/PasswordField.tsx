import { Input } from "@material-tailwind/react";
import { Eye, EyeOff } from "lucide-react";

export interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  isVisible: boolean;
  onToggleVisibility: () => void;
  error?: boolean;
  disabled?: boolean;
}

export default function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  isVisible,
  onToggleVisibility,
  error,
  disabled,
}: PasswordFieldProps) {
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
      disabled={disabled}
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
