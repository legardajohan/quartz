import React, { useState } from "react";
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
      <div className="relative">
        <ProfileNavbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <main
          className={`px-4 py-2 mt-4 transition-all duration-300 ease-in-out ${
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