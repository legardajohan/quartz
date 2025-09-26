import { Button, Input } from '../../../components/ui/index';
import { EyeIcon, EyeSlashIcon } from '../../../components/icons/index';

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
  return (
    <div className="flex-1 flex items-center justify-center p-10 bg-white">
      <div className="w-full max-w-[400px]">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl text-purple-800 font-bold mb-4">
            Bienvenido
          </h1>
          <div className="w-[200px] h-1 bg-pink-500 mx-auto mb-6"></div>
          <p className="text-xl text-gray-800">
            ¡Explora un mundo totalmente nuevo!
          </p>
        </div>
        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <Input
            label="Correo"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full"
            required
            disabled={isLoading}
          />
          <div className="relative">
            <Input
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full pr-12"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-600 focus:outline-none p-1 transition-all duration-200 ease-in-out active:scale-[0.8]"
              disabled={isLoading}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? (
                <EyeSlashIcon className="w-6 h-6" />
              ) : (
                <EyeIcon className="w-6 h-6" />
              )}
            </button>
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <Button
            isLoading={isLoading}
            loadingText="Ingresando..."
            type="submit"
            disabled={isLoading || !formData.email.trim() || !formData.password.trim()}
          >
            Ingresar
          </Button>
          <div className="text-center text-gray-400 text-base">
            Olvidaste tu contraseña? 
            <button
              type="button"
              onClick={handleForgotPassword}
              className="font-bold text-pink-500 ml-2 hover:text-pink-600 focus:outline-none focus:underline transition-colors"
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