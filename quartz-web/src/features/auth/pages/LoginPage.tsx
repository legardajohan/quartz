import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '../useAuthStore';
import { PresentationPanel } from '../components/PresentationPanel';
import { LoginPanel } from '../components/LoginPanel';
import type { AuthLocationState } from '../types';

export default function LoginPage() {
  const location = useLocation();
  // Llega desde `/restablecer-contrasena` (aviso + correo) o `/recuperar-contrasena` (correo).
  const [locationState] = useState(() => location.state as AuthLocationState | null);
  const [formData, setFormData] = useState({
    email: locationState?.email ?? '',
    password: '',
  });
  const [notice, setNotice] = useState<string | null>(locationState?.notice ?? null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, isLoading, error, token } = useAuthStore(
    useShallow((s) => ({ login: s.login, isLoading: s.isLoading, error: s.error, token: s.token }))
  );

  // El aviso se muestra una sola vez: recargar la página no debe repetirlo.
  useEffect(() => {
    if (location.state) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [token, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    if (formData.email.trim() && formData.password.trim()) {
      await login(formData.email.trim(), formData.password);
    }
  };

  const handleForgotPassword = () => {
    const state: AuthLocationState = { email: formData.email.trim() };
    navigate('/recuperar-contrasena', { state });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <div className="flex flex-col md:flex-row rounded-3xl shadow-2xl bg-white/90 overflow-hidden max-w-5xl w-full md:min-h-[520px] md:max-h-[600px]">
        <PresentationPanel />
        <LoginPanel
          formData={formData}
          isLoading={isLoading}
          error={error}
          notice={notice}
          showPassword={showPassword}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          handleForgotPassword={handleForgotPassword}
          setShowPassword={setShowPassword}
        />
      </div>
    </div>
  );
}