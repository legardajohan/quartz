import React from "react";
import {
    Avatar,
    Button,
    Menu,
    MenuHandler,
    MenuItem,
    MenuList,
    Typography,
} from "@material-tailwind/react";
import {
    ChevronDownIcon,
    Cog6ToothIcon,
    InboxArrowDownIcon,
    LifebuoyIcon,
    PowerIcon,
    UserCircleIcon,
} from "@heroicons/react/24/solid";
import { useAuthStore } from "../../features/auth/useAuthStore";
import userImage from '../../assets/images/user.png';

// profile menu component
const profileMenuItems = [
    {
        label: "Mi perfil",
        icon: UserCircleIcon,
    },
    {
        label: "Editar perfil",
        icon: Cog6ToothIcon,
    },
    {
        label: "Bandeja de entrada",
        icon: InboxArrowDownIcon,
    },
    {
        label: "Ayuda",
        icon: LifebuoyIcon,
    },
    {
        label: "Cerrar sesión",
        icon: PowerIcon,
    },
];

export function UserMenu() {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    const handleMenuClick = (label: string) => {
        if (label === "Cerrar sesión") {
            logout();
        }
        setIsMenuOpen(false);
    };

    return (
        <Menu open={isMenuOpen} handler={setIsMenuOpen} placement="bottom-end">
            <MenuHandler>
                <Button
                    variant="text"
                    color="blue-gray"
                    className={`flex items-center gap-1 rounded-full py-0.5 pr-2 pl-0.5 lg:ml-auto hover:bg-purple-100 ${isMenuOpen ? "text-purple-800" : "text-gray-900"}`}
                >
                    <Avatar
                        variant="circular"
                        size="sm"
                        alt={user?.firstName || "User"}
                        className="border border-purple-300 p-0.5"
                        src={userImage} // Use the imported default image
                    />
                    <Typography as="span" variant="small" className="font-normal px-2 normal-case text-[16px]">
                        {user?.firstName}
                    </Typography>
                    <ChevronDownIcon
                        strokeWidth={2.5}
                        className={`h-3 w-3 transition-transform ${isMenuOpen ? "rotate-180 text-purple-800" : ""}`}
                    />
                </Button>
            </MenuHandler>
            <MenuList className="p-1">
                {profileMenuItems.map(({ label, icon }, key) => {
                    const isLastItem = key === profileMenuItems.length - 1;
                    return (
                        <MenuItem
                            key={label}
                            onClick={() => handleMenuClick(label)}
                            className={`flex items-center gap-2 rounded ${isLastItem
                                    ? "hover:bg-pink-300/40 focus:bg-pink-300/40 active:bg-pink-300/50"
                                    : "hover:bg-purple-300/40 focus:bg-purple-300/40 active:bg-purple-300/50"
                                }`}
                        >
                            {React.createElement(icon, {
                                className: `h-4 w-4 ${isLastItem ? "text-pink-600" : ""}`,
                                strokeWidth: 2,
                            })}
                            <Typography
                                as="span"
                                variant="small"
                                className={`font-normal ${isLastItem ? "text-pink-600" : "inherit"}`}
                            >
                                {label}
                            </Typography>
                        </MenuItem>
                    );
                })}
            </MenuList>
        </Menu>
    );
}