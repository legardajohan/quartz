import React from "react";
import { useNavigate } from "react-router-dom";
import {
    Avatar,
    Button,
    Menu,
    MenuHandler,
    MenuItem,
    MenuList,
    Typography,
} from "@material-tailwind/react";
import { ChevronDown, KeyRound, LogOut, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuthStore } from "../../features/auth/useAuthStore";
import { AVATAR_FALLBACK } from "@/constants/assets";

type ProfileMenuItem =
    | { label: string; icon: LucideIcon; to: string }
    | { label: string; icon: LucideIcon; action: "logout" };

const PROFILE_MENU_ITEMS: ProfileMenuItem[] = [
    { label: "Mi perfil", icon: UserRound, to: "/mi-cuenta?tab=perfil" },
    { label: "Cambiar contraseña", icon: KeyRound, to: "/mi-cuenta?tab=contrasena" },
    { label: "Cerrar sesión", icon: LogOut, action: "logout" },
];

export function UserMenu() {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const user = useAuthStore((state) => state.sessionData?.user);
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

    const handleMenuClick = (item: ProfileMenuItem) => {
        setIsMenuOpen(false);
        if ("action" in item) {
            logout();
            return;
        }
        navigate(item.to);
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
                        alt={user?.firstName || "Usuario"}
                        className="border border-purple-300 p-0.5"
                        src={user?.avatarUrl || AVATAR_FALLBACK}
                    />
                    <Typography as="span" variant="small" className="font-normal px-2 normal-case text-[16px]">
                        {user?.firstName} {user?.lastName}
                    </Typography>
                    <ChevronDown
                        strokeWidth={2.5}
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${isMenuOpen ? "rotate-180 text-purple-800" : ""}`}
                        aria-hidden
                    />
                </Button>
            </MenuHandler>
            <MenuList className="min-w-[13rem] p-1">
                {PROFILE_MENU_ITEMS.map((item) => {
                    const isLogout = "action" in item;
                    const Icon = item.icon;
                    return (
                        <MenuItem
                            key={item.label}
                            onClick={() => handleMenuClick(item)}
                            className={`flex items-center gap-2.5 rounded ${isLogout
                                    ? "mt-1 border-t border-gray-100 hover:bg-pink-300/40 focus:bg-pink-300/40 active:bg-pink-300/50"
                                    : "hover:bg-purple-300/40 focus:bg-purple-300/40 active:bg-purple-300/50"
                                }`}
                        >
                            <Icon className={`h-4 w-4 ${isLogout ? "text-pink-600" : ""}`} strokeWidth={2} aria-hidden />
                            <Typography
                                as="span"
                                variant="small"
                                className={`font-normal ${isLogout ? "text-pink-600" : "inherit"}`}
                            >
                                {item.label}
                            </Typography>
                        </MenuItem>
                    );
                })}
            </MenuList>
        </Menu>
    );
}
