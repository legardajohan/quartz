import { Navbar } from "@material-tailwind/react";

import { UserMenu } from "../common/UserMenu";
import { InstitutionBrand } from "../common/InstitutionBrand";
import { TOPBAR_HEIGHT_CLASS } from "./topbar.constants";

interface ProfileNavbarProps {
    isSidebarOpen: boolean;
}

export function ProfileNavbar({ isSidebarOpen }: ProfileNavbarProps) {
    return (
        <Navbar color="transparent" className={`${TOPBAR_HEIGHT_CLASS} max-w-full rounded-none px-4 lg:px-8`}>
            {/* InstitutionBrand queda SIEMPRE montado (solo se alterna su visibilidad) para que
                la fila nunca cambie de estructura al abrir/cerrar el sidebar. La fila usa
                TOPBAR_HEIGHT_CLASS (misma altura fija que la cabecera del sidebar en
                SidebarMenu) + `h-full` en lugar de un alto derivado del padding/contenido:
                así su centro vertical es siempre `altura/2`, sin depender de si el padding
                de <Navbar> o el breakpoint activo coinciden con los del sidebar — la causa
                real de que el avatar y el logo del inquilino quedaran desalineados al
                abrir/cerrar el sidebar en intentos previos. */}
            <div
                className={`relative mx-auto flex h-full items-center justify-between text-blue-gray-900 ${
                    !isSidebarOpen ? "pl-14" : ""
                }`}
            >
                <div
                    className={`flex items-center gap-3 transition-opacity duration-150 ${
                        isSidebarOpen ? "invisible opacity-0" : "visible opacity-100"
                    }`}
                >
                    <InstitutionBrand tone="light" />
                </div>
                <div className="flex-grow" />
                <UserMenu />
            </div>
        </Navbar>
    );
}