import React from 'react';
import { SpinnerIcon } from '../icons/SpinnerIcon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    isLoading,
    loadingText,
    disabled,
    className,
    type = 'button',
    variant = 'primary',
    icon,
    ...props
  }, ref) => {
    const baseStyles =
      'w-full h-12 text-xl font-normal rounded-3xl border focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2';

    const variants: Record<string, string> = {
      primary: 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700 focus:ring-purple-700',
      secondary: 'bg-white text-purple-600 border-purple-600 hover:bg-purple-50 focus:ring-purple-600',
      danger: 'bg-red-600 text-white border-red-600 hover:bg-red-700 focus:ring-red-600',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${className ?? ''}`}
        {...props}
      >
        {isLoading ? (
          <>
            <SpinnerIcon className="w-6 h-6 mr-2" />
            {loadingText ?? children}
          </>
        ) : (
          <>
            {icon && <span className="mr-2">{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';