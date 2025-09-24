import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>((
  { label, type = 'text', name, className, ...props }, 
  ref
) => {
  
  const id = React.useId();

  return (
    <div className="relative">
      <input
        id={id}
        ref={ref}
        type={type}
        name={name}
        placeholder=" "
        className={`
          w-full h-12 px-4 pt-2 pb-2 border border-purple-800 rounded-2xl bg-white 
          focus:outline-none focus:ring-[1.3px] focus:ring-purple-600 focus:border-transparent 
          transition-all peer
          ${className}
        `}
        {...props}
      />
      <label
        htmlFor={id}
        className="
          absolute left-4 top-3 text-gray-500 bg-white px-1 transition-all duration-200
          text-sm -translate-y-6
          peer-placeholder-shown:text-base peer-placeholder-shown:translate-y-0
          peer-focus:-translate-y-6 peer-focus:text-sm peer-focus:text-pink-500
        "
      >
        {label}
      </label>
    </div>
  );
});

Input.displayName = 'Input';
