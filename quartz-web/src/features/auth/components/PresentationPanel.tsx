import loginBg from '../../../assets/images/login-bg.jpg';
import '../../../components/common/rainbow-fill.css';
import './PresentationPanel.css';

export function PresentationPanel() {
  return (
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
      <div className="absolute inset-0 bg-black/50" style={{ zIndex: 1 }} />
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo con relleno arcoíris animado */}
        <div className="presentation-brand__logo" role="img" aria-label="Quartz">
          <div className="presentation-brand__aura quartz-rainbow-fill" aria-hidden="true" />
          <div className="presentation-brand__fill quartz-rainbow-fill" aria-hidden="true" />
          <div className="presentation-brand__sheen" aria-hidden="true" />
        </div>
        {/* Inspirational Text */}
        <div className="text-center max-w-sm mt-6">
          <p className="text-white text-xl font-normal leading-tight">
            <span className="block">Evaluando con sentido</span>
          </p>
        </div>
      </div>
    </div>
  );
}
