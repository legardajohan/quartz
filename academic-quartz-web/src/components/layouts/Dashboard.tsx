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
          className={`p-4 mt-5 transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "lg:ml-[20rem]" : "ml-0"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}