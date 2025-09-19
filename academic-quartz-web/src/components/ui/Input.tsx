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
        // El placeholder=" " es clave para que la animación del label funcione siempre.
        placeholder=" " 
        // Combinamos clases base con clases personalizadas que se puedan pasar a través de props.
        className={`
          w-full h-12 px-4 pt-6 pb-2 border border-purple-600 rounded-2xl bg-white 
          focus:outline-none focus:ring-[1.5px] focus:ring-purple-600 focus:border-transparent 
          transition-all peer
          ${className}
        `}
        {...props}
      />
      <label 
        htmlFor={id}
        // Estas clases manejan la animación "floating label".
        // Se mueve hacia arriba cuando el input tiene foco (peer-focus) o cuando tiene contenido (peer-placeholder-shown).
        className="
          absolute left-4 top-3 text-gray-500 bg-white px-1 transition-all duration-200 
          peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
          peer-focus:-translate-y-6 peer-focus:text-sm peer-focus:text-pink-500
        "
      >
        {label}
      </label>
    </div>
  );
});

// Asignamos un nombre para que sea más fácil de depurar en las React DevTools.
Input.displayName = 'Input';
