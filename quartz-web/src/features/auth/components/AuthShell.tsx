import type { ReactNode } from "react";
import { PresentationPanel } from "./PresentationPanel";

// Marco de las pantallas públicas de cuenta (activar, recuperar, restablecer): mismo layout que el login.
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="flex min-h-[600px] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white/90 shadow-2xl md:flex-row">
        <PresentationPanel />
        <div className="flex flex-1 items-center justify-center bg-white p-10">{children}</div>
      </div>
    </div>
  );
}
