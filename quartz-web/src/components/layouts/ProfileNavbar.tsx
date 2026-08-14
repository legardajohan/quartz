import { IconButton, Navbar } from "@material-tailwind/react";
import { PanelLeftOpen } from "lucide-react";

import { UserMenu } from "../common/UserMenu";
import { InstitutionBrand } from "../common/InstitutionBrand";

interface ProfileNavbarProps {
    toggleSidebar: () => void;
    isSidebarOpen: boolean;
}

export function ProfileNavbar({ toggleSidebar, isSidebarOpen }: ProfileNavbarProps) {
    return (
        <Navbar color="transparent" className="sticky top-0 z-10 h-max max-w-full rounded-none px-4 py-2 lg:px-8 lg:py-4">
            <div className="relative mx-auto flex items-center justify-between text-blue-gray-900">
                {!isSidebarOpen && (
                    <div className="flex items-center gap-3">
                        <IconButton
                            variant="text"
                            color="blue-gray"
                            onClick={toggleSidebar}
                        >
                            <PanelLeftOpen className="h-7 w-7" strokeWidth={1.75} />
                        </IconButton>

                        <InstitutionBrand tone="light" />
                    </div>
                )}
                <div className="flex-grow" />
                <UserMenu />
            </div>
        </Navbar>
    );
}