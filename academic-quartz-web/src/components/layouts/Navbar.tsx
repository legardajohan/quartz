import { IconButton, Navbar, Typography, } from "@material-tailwind/react";
import { Bars3Icon } from "@heroicons/react/24/solid";

import { UserProfile } from "../common/UserProfile";

interface ProfileNavbarProps {
    toggleSidebar: () => void;
    isSidebarOpen: boolean;
}

import academicQuartz from '../../assets/academic-quartz.svg';

export function ProfileNavbar({ toggleSidebar, isSidebarOpen }: ProfileNavbarProps) {

    return (
        <Navbar className="sticky top-0 z-10 h-max max-w-full rounded-none px-4 py-2 lg:px-8 lg:py-4">
            <div className="relative mx-auto flex items-center justify-between text-blue-gray-900">
                {!isSidebarOpen && (
                    <div className="flex items-center gap-3">
                        <IconButton
                            variant="text"
                            color="blue-gray"
                            onClick={toggleSidebar}
                        >
                            <Bars3Icon className="h-6 w-6" />
                        </IconButton>

                        <img
                            src={academicQuartz}
                            alt="brand"
                            className="h-10 w-10"
                        />
                        <h1 className="font-space text-[27px] text-purple-800">
                            QUARTZ
                        </h1>
                    </div>
                )}
                <div className="flex-grow" />
                <UserProfile />
            </div>
        </Navbar>
    );
}