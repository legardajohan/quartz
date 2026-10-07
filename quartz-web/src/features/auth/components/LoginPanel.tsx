import { Input, Button } from '@material-tailwind/react';
import { Eye, EyeOff } from 'lucide-react';

interface LoginPanelProps {
  formData: { email: string; password: string };
  isLoading: boolean;
  error: string | null;
  showPassword: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleForgotPassword: () => void;
  setShowPassword: (show: boolean) => void;
}

export function LoginPanel({
  formData,
  isLoading,
  error,
  showPassword,
  handleInputChange,
  handleSubmit,
  handleForgotPassword,
  setShowPassword,
}: LoginPanelProps) {
  const ToggleIcon = showPassword ? EyeOff : Eye;

  return (
    <div className="flex-1 flex items-center justify-center p-10 bg-white">
      <div className="w-full max-w-[400px]">
        <div className="mb-10 text-center">
          <h1 className="mb-4 text-4xl font-bold text-purple-800 [text-wrap:balance]">Bienvenido</h1>
          <div className="mx-auto mb-6 h-1 w-[120px] bg-pink-500" />
          <p className="text-lg text-gray-800 [text-wrap:pretty]">¡Explora un mundo totalmente nuevo!</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            color="purple"
            label="Correo"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            autoComplete="username"
            crossOrigin="anonymous"
            required
            disabled={isLoading}
          />
          <Input
            color="purple"
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            autoComplete="current-password"
            crossOrigin="anonymous"
            required
            disabled={isLoading}
            icon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
                className="-m-1.5 rounded-md p-1.5 text-gray-500 transition-colors duration-150 hover:text-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-500"
              >
                <ToggleIcon className="h-4 w-4" aria-hidden />
              </button>
            }
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
            loading={isLoading}
            disabled={isLoading || !formData.email.trim() || !formData.password.trim()}
            className="active:scale-[0.97] transition-transform duration-150"
          >
            {isLoading ? 'Ingresando…' : 'Ingresar'}
          </Button>

          <div className="text-center text-sm text-gray-500">
            ¿Olvidaste tu contraseña?{' '}
            <button
              type="button"
              onClick={handleForgotPassword}
              className="font-semibold text-pink-600 hover:text-pink-700 focus:outline-none focus:underline transition-colors"
              disabled={isLoading}
            >
              Recuperar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
