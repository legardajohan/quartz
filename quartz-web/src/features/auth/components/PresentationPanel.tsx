import loginIllustration from '../../../assets/images/login-illustration.svg';
import '../../../components/common/rainbow-fill.css';
import './PresentationPanel.css';

export function PresentationPanel() {
  return (
    // Degradado de marca invertido (oscuro arriba → claro abajo): el logo arcoíris resalta sobre
    // purple-950 y la ilustración, de tonos claros, queda sobre purple-800.
    // Marca arriba; la ilustración abajo, apoyada sobre su línea de suelo.
    <div className="flex-1 flex flex-col items-center justify-between gap-10 px-10 py-10 bg-gradient-to-b from-purple-950 to-purple-800">
      <div className="flex flex-col items-center">
        {/* Logo con relleno arcoíris animado */}
        <div className="presentation-brand__logo" role="img" aria-label="Quartz">
          <div className="presentation-brand__aura quartz-rainbow-fill" aria-hidden="true" />
          <div className="presentation-brand__fill quartz-rainbow-fill" aria-hidden="true" />
          <div className="presentation-brand__sheen" aria-hidden="true" />
        </div>
        {/* Inspirational Text */}
        <div className="text-center max-w-sm mt-6">
          <p className="text-white text-lg font-normal leading-tight">
            <span className="block">Evaluando con sentido</span>
          </p>
        </div>
      </div>
      {/* Ilustración decorativa (undraw, recoloreada a la paleta). Se oculta en móvil para
          que el formulario quede cerca del borde superior. */}
      <img
        src={loginIllustration}
        alt=""
        aria-hidden="true"
        width={752}
        height={556}
        className="presentation-illustration hidden md:block w-full max-w-md h-auto"
      />
    </div>
  );
}
