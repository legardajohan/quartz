import React, { useState } from 'react';
import { useAuthStore } from '../useAuthStore';
import { PresentationPanel } from '../components/PresentationPanel';
import { LoginPanel } from '../components/LoginPanel';
import circleBg from '../../../assets/images/circle-bg.png';

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
      className="min-h-screen w-full flex items-center justify-center"
      style={{
        backgroundImage: `url(${circleBg})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <div className="flex flex-col md:flex-row rounded-3xl shadow-2xl bg-white/90 overflow-hidden max-w-5xl w-full min-h-[600px]">
        <PresentationPanel />
        <LoginPanel
          formData={formData}
          isLoading={isLoading}
          error={error}
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