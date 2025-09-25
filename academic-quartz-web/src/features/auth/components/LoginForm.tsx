import React, { useState } from 'react';
import { useAuthStore } from '../useAuthStore';
import { Input } from '../../../components/ui/Input';
import { EyeIcon, EyeSlashIcon } from '../../../components/icons/index';
import { Button } from '../../../components/ui/Button';
import loginBg from '../../../assets/login-bg.jpg';
import aqWhite from '../../../assets/aq-white.svg';
import circleBg from '../../../assets/circle-bg.png';

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
    <div 
      className="min-h-screen w-full flex items-center justify-center "
      style={{
                backgroundImage: `url(${circleBg})`,
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
              }}
    >
      <div className="flex flex-col md:flex-row rounded-3xl shadow-2xl bg-white/90 overflow-hidden max-w-5xl w-full min-h-[600px]">
        {/* Presentation Side */}
        <div className="flex-1 flex flex-col items-center justify-end px-10 py-8 relative bg-gradient-to-br from-purple-700/80 to-purple-900/80">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
            style={{
              backgroundImage: `url(${loginBg})`,
              zIndex: 0,
            }}
          />
          {/* Overlay for better contrast */}
          <div className="absolute inset-0 bg-purple-900/40" style={{ zIndex: 1 }} />
          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Logo */}
            <div
              className="w-20 h-20 rounded-lg flex items-center justify-center mb-1"
              style={{
                backgroundImage: `url(${aqWhite})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
              }}
            />
            {/* Title */}
            <h1 className="font-space text-4xl text-white tracking-wider mb-2 text-center">
              ACADEMIC QUARTZ
            </h1>
            {/* Inspirational Text */}
            <div className="text-center max-w-sm">
              <p className="text-white text-xl font-normal leading-tight">
                <span className="block">El principio de todo inicia cuando</span>
                <span className="block">permites lo que mereces</span>
              </p>
            </div>
          </div>
        </div>

        {/* Login Form Side */}
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
      </div>
    </div>
  );
}