import React, { useState } from 'react';
import { useAuthStore } from '../useAuthStore';
import { Input } from '../../../components/ui/Input';
import { EyeIcon, EyeSlashIcon } from '../../../components/icons/index';

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoading, error } = useAuthStore();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.email.trim() && formData.password.trim()) {
      await login(formData.email.trim(), formData.password);
    }
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password functionality
    console.log('Forgot password clicked');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Background Image */}
      <div className="flex-1 relative">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzIyIiBoZWlnaHQ9IjgyMSIgdmlld0JveD0iMCAwIDcyMiA4MjEiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI3MjIiIGhlaWdodD0iODIxIiBmaWxsPSIjRjVGNUY1Ii8+CjxjaXJjbGUgY3g9IjM2MSIgY3k9IjQxMCIgcj0iMjAwIiBmaWxsPSIjNjIwREQxIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4K')`
          }}
        />
      </div>

      {/* Right Side - Login Form */}
      <div className="w-[721px] bg-white flex items-center justify-center px-8 shadow-2xl">
        <div className="w-full max-w-[458px]">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4" style={{ color: 'rgba(94, 3, 254, 0.99)' }}>
              Bienvenido
            </h1>
            <div className="w-[200px] h-1 bg-pink-500 mx-auto mb-6"></div>
            <p className="text-xl text-gray-800">
              ¡Explora un mundo totalmente nuevo!
            </p>

          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Usuario Field */}
            <Input
              label='Correo'
              type='email'
              name='email'
              value={formData.email}
              onChange={handleInputChange}
              className="w-full"
              required
              disabled={isLoading}
            />

            {/* Contraseña Field */}
            <div className="relative">
              <Input
                label='Contraseña'
                type={showPassword ? 'text' : 'password'}
                name='password'
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pr-12"
                required
                disabled={isLoading}
              />
              
              <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-600 focus:outline-none p-1 transition-all duration-200 ease-in-out active:scale-80"
                  disabled={isLoading}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-6 h-6" />
                  ) : (
                    <EyeIcon className="w-6 h-6" />
                  )

                  }
                </button>
            </div>


            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading || !formData.email.trim() || !formData.password.trim()}
              className="w-full h-12 bg-purple-600 text-white text-xl font-normal rounded-3xl border border-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Ingresando...
                </div>
              ) : (
                'Ingresar'
              )}
            </button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xl font-bold text-pink-500 hover:text-pink-600 focus:outline-none focus:underline transition-colors"
                disabled={isLoading}
              >
                Olvidé mi contraseña
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}