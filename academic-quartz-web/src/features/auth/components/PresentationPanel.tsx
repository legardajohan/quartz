import aqWhite from '../../../assets/aq-white.svg';
import loginBg from '../../../assets/login-bg.jpg';

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
  );
}