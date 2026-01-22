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
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";

import aqWhite from '../../assets/images/aq-white.svg';
import starryBackground from '../../assets/images/starry-background.svg';

interface SidebarMenuProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const menuItems = [
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
    ],
  },
];

export function SidebarMenu({ isSidebarOpen, toggleSidebar }: SidebarMenuProps) {
  const appName = import.meta.env.VITE_APP_NAME;
  const location = useLocation();
  const navigate = useNavigate();

  const initiallyOpenAccordion = menuItems.find(item => item.basePath && location.pathname.startsWith(item.basePath))?.id || 0;
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
      className={`fixed top-0 left-0 h-screen z-40 transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      <Card
        shadow={false}
        className="h-screen w-full max-w-[20rem] px-4 py-1 text-white shadow-xl shadow-purple-700/50 rounded-none"
        style={{ background: `${bgPattern}, ${gradient}` }}
      >
        <div className="mb-2 flex items-center gap-3 px-2 py-4">
          <img src={aqWhite} alt="brand" className="h-10 w-10" />
          <h1 className="font-space text-[27px] text-white">
            {appName.toUpperCase()}
          </h1>
          <IconButton variant="text" size="sm" className="ml-auto text-purple-400 hover:text-white hover:bg-purple-700/40" onClick={toggleSidebar}>
            <ChevronLeftIcon strokeWidth={3} className="h-4 w-4" />
          </IconButton>
        </div>
        <List className="mt-4">
          {menuItems.map((item) => {
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
      </Card>
    </div>
  );
}
