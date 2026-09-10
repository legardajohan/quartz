import React, { useState } from "react";
import { IconButton } from "@material-tailwind/react";
import { PanelLeftOpen } from "lucide-react";
import { SidebarMenu } from "./SidebarMenu";
import { ProfileNavbar } from "./ProfileNavbar";

export function Dashboard({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-blue-gray-50/50">
      <SidebarMenu isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      {/* ripple={false}: el ripple de material-tailwind (vía material-ripple-effects) hace
          `element.style.position = 'relative'` INLINE sobre el botón en el primer mousedown y
          nunca lo limpia. Un estilo inline gana siempre sobre la clase `fixed` de abajo, así
          que tras el primer clic este botón deja de estar `fixed` y pasa a ocupar espacio real
          en el flujo, empujando el header hacia abajo — la causa real de que la barra con el
          nombre de la institución y el usuario "bajara" tras interactuar con el sidebar. */}
      <IconButton
        variant="text"
        color="blue-gray"
        ripple={false}
        onClick={toggleSidebar}
        aria-label="Abrir menú"
        aria-hidden={isSidebarOpen}
        tabIndex={isSidebarOpen ? -1 : 0}
        className={`fixed top-4 left-4 z-30 bg-white/80 shadow-sm backdrop-blur transition-all duration-200 ease-out ${
          isSidebarOpen ? "pointer-events-none scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        <PanelLeftOpen className="h-7 w-7" strokeWidth={1.75} />
      </IconButton>
      <div className="relative">
        <ProfileNavbar isSidebarOpen={isSidebarOpen} />
        <main
          className={`isolate px-4 py-2 mt-4 transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "lg:ml-[20rem]" : "ml-0"
          }`}
        >
          {/* Aquí se renderizan las funcionalidades del menú */}
          {children}
        </main>
      </div>
    </div>
  );
}