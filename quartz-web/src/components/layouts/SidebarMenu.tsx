import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemPrefix,
  Accordion,
  AccordionHeader,
  AccordionBody,
  Card,
} from "@material-tailwind/react";
import {
  AcademicCapIcon,
  DocumentCheckIcon,
  HomeIcon,
  PresentationChartBarIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/solid";
import {
  ChevronRightIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { PanelLeftClose } from "lucide-react";

import starryBackground from '../../assets/images/starry-background.svg';
import { useAuthStore } from '../../features/auth/useAuthStore';
import { PoweredByBrand } from '../common/PoweredByBrand';
import { InstitutionBrand } from '../common/InstitutionBrand';
import { TOPBAR_HEIGHT_CLASS } from './topbar.constants';
import type { UserRole } from '@/types/domain';

interface SidebarMenuProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

interface SidebarSubItem {
  id: number;
  label: string;
  path: string;
  roles?: UserRole[];
}

interface SidebarMenuItem {
  id: number;
  icon: React.ReactNode;
  label: string;
  path?: string;
  basePath?: string;
  subItems?: SidebarSubItem[];
  roles?: UserRole[];
}

const menuItems: SidebarMenuItem[] = [
  {
    id: 1,
    icon: <HomeIcon className="h-5 w-5" />,
    label: "Inicio",
    path: "/dashboard",
  },
  {
    id: 2,
    icon: <AcademicCapIcon className="h-5 w-5" />,
    label: "Académico",
    basePath: "/academico",
    subItems: [
      { id: 21, label: "Aprendizajes", path: "/academico/aprendizajes" },
      { id: 22, label: "Conceptos", path: "/academico/conceptos" },
      { id: 23, label: "Lista de chequeo", path: "/academico/lista-chequeo" },
    ],
  },
  {
    id: 3,
    icon: <DocumentCheckIcon className="h-5 w-5" />,
    label: "Evaluación",
    path: "/evaluacion",
  },
  {
    id: 4,
    icon: <PresentationChartBarIcon className="h-5 w-5" />,
    label: "Informes",
    path: "/informes",
  },
  {
    id: 5,
    icon: <ShieldCheckIcon className="h-5 w-5" />,
    label: "Gestión",
    basePath: "/gestion",
    subItems: [
      { id: 51, label: "Usuarios", path: "/gestion/usuarios" },
      { id: 52, label: "Consolidados", path: "/gestion/consolidados" },
      { id: 53, label: "Configuración", path: "/gestion/configuracion", roles: ["Jefe de Área"] },
    ],
  },
];

export function SidebarMenu({ isSidebarOpen, toggleSidebar }: SidebarMenuProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.sessionData?.user.role);

  const visibleMenuItems = menuItems
    .filter((item) => !item.roles || (!!role && item.roles.includes(role)))
    .map((item) =>
      item.subItems
        ? { ...item, subItems: item.subItems.filter((sub) => !sub.roles || (!!role && sub.roles.includes(role))) }
        : item
    );

  const initiallyOpenAccordion = visibleMenuItems.find(item => item.basePath && location.pathname.startsWith(item.basePath))?.id || 0;
  const [open, setOpen] = React.useState(initiallyOpenAccordion);

  const handleOpen = (value: number) => {
    setOpen(open === value ? 0 : value);
  };

  // Style variables
  const activeClass = "!bg-purple-700/40 shadow-lg text-white focus:!bg-purple-700/40 focus:!text-white";
  const hoverClass = "hover:bg-purple-600/30 hover:text-white";
  const inactiveClass = "text-purple-300";

  const bgPattern = `url(${starryBackground})`;
  const gradient = 'linear-gradient(4.01deg, #290460 19.26%, #620DD1 97.65%)';

  return (
    <div
      // `will-change-transform` promueve este panel a su propia capa de composición desde el
      // montaje inicial. Sin esto, el navegador solo crea la capa cuando ve la PRIMERA animación
      // de `transform`, y ese primer clic paga el costo de esa promoción como un frame de salto
      // (jank) antes de animar — exactamente el "brinca y no colapsa en el primer clic, luego
      // funciona bien" reportado. Con la capa ya promovida de antemano, el primer toggle anima
      // igual de liso que los siguientes.
      className={`fixed top-0 left-0 h-screen z-40 will-change-transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-[calc(100%+28px)]"}`}
    >
      <Card
        shadow={false}
        className="h-screen w-full max-w-[20rem] text-white shadow-xl shadow-purple-700/50 rounded-none flex flex-col"
        style={{ background: `${bgPattern}, ${gradient}` }}
      >
        {/* TOPBAR_HEIGHT_CLASS: misma altura fija que <ProfileNavbar> (el header, a la
            derecha del sidebar). Ambas filas parten de y=0 del viewport (este contenedor
            es `fixed top-0`, el header es el primer hijo de flujo de la página), así que
            fijar aquí la misma altura explícita garantiza que el logo del inquilino quede
            centrado en la misma línea que el avatar del usuario cuando el sidebar está
            abierto, sin depender de que los paddings de ambos coincidan por casualidad. */}
        <div className={`relative mb-2 flex items-center gap-2 pl-4 pr-3 ${TOPBAR_HEIGHT_CLASS} shrink-0`}>
          <div className="flex-1 min-w-0">
            <InstitutionBrand />
          </div>
          {/* ripple={false}: ver el comentario equivalente en el botón "Abrir menú" de
              Dashboard.tsx — el ripple de material-tailwind fija `position: relative` inline
              en el primer clic y nunca lo revierte, rompiendo el `absolute` del que depende
              este botón para flotar sobre el borde del sidebar (si no, tras el primer clic pasa
              a ocupar espacio real dentro de la fila flex, ensanchándola). */}
          <IconButton
            variant="text"
            size="sm"
            ripple={false}
            className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-[calc(50%+6px)] shrink-0 bg-purple-800 text-purple-200 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/60 hover:bg-purple-700 hover:text-white"
            onClick={toggleSidebar}
          >
            <PanelLeftClose strokeWidth={2} className="h-4 w-4" />
          </IconButton>
        </div>
        <List className="mt-4 flex-1 overflow-y-auto thin-scrollbar px-4">
          {visibleMenuItems.map((item) => {
            if (!item.subItems) {
              const isActive = location.pathname.startsWith(item.path!);
              return (
                <ListItem
                  key={item.id}
                  onClick={() => navigate(item.path!)}
                  className={`group rounded-lg active:bg-purple-500/10 ${hoverClass} ${isActive ? activeClass : inactiveClass}`}
                >
                  <ListItemPrefix className={`group-hover:text-white ${isActive ? "text-white" : inactiveClass}`}>
                    {item.icon}
                  </ListItemPrefix>
                  <Typography color="inherit" className="font-normal">
                    {item.label}
                  </Typography>
                </ListItem>
              );
            }

            const isChildActive = location.pathname.startsWith(item.basePath!)
            const isAccordionOpen = open === item.id;

            return (
              <Accordion
                key={item.id}
                open={isAccordionOpen}
                icon={<ChevronDownIcon strokeWidth={2.5} className={`mx-auto h-4 w-4 transition-transform group-hover:text-white ${isAccordionOpen ? "rotate-180" : ""} ${isChildActive ? "text-white" : inactiveClass}`} />}
              >
                <ListItem className="p-0 group hover:bg-transparent active:bg-transparent">
                  <AccordionHeader onClick={() => handleOpen(item.id)} className={`border-b-0 p-3 rounded-lg active:bg-purple-500/30 ${hoverClass} ${isChildActive ? activeClass : isAccordionOpen ? "bg-purple-500/30 hover:bg-purple-600/30 text-white" : inactiveClass}`}>
                    <ListItemPrefix className={`group-hover:text-white ${isChildActive ? "text-white" : inactiveClass}`}>
                      {item.icon}
                    </ListItemPrefix>
                    <Typography color="inherit" className="mr-auto font-normal">
                      {item.label}
                    </Typography>
                  </AccordionHeader>
                </ListItem>
                <AccordionBody className="py-1">
                  <List className="p-0">
                    {item.subItems.map(subItem => {
                      const isSubItemActive = location.pathname === subItem.path;
                      return (
                        <ListItem
                          key={subItem.id}
                          onClick={() => navigate(subItem.path)}
                          className={`group rounded-lg active:bg-purple-500/10 ${hoverClass} ${isSubItemActive ? activeClass : inactiveClass}`}
                        >
                          <ListItemPrefix>
                            <ChevronRightIcon strokeWidth={3} className={`h-3 w-5 group-hover:text-white ${isSubItemActive ? "text-white" : inactiveClass}`} />
                          </ListItemPrefix>
                          <Typography color="inherit" className="font-normal">
                            {subItem.label}
                          </Typography>
                        </ListItem>
                      );
                    })}
                  </List>
                </AccordionBody>
              </Accordion>
            );
          })}
        </List>
        <div className="border-t border-white/10 px-4">
          <PoweredByBrand />
        </div>
      </Card>
    </div>
  );
}
