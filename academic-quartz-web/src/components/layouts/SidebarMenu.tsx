import React from "react";
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
  DocumentArrowDownIcon,
  DocumentCheckIcon,
  HomeIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/solid";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";

import aqWhite from '../../assets/aq-white.svg';

interface SidebarMenuProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export function SidebarMenu({ isSidebarOpen, toggleSidebar }: SidebarMenuProps) {
  const [open, setOpen] = React.useState(0);
  const [activeItem, setActiveItem] = React.useState(1); // Set 'Inicio' as default active item

  const handleOpen = (value: number) => {
    setOpen(open === value ? 0 : value);
  };

  const handleActive = (itemId: number) => {
    setActiveItem(itemId);
  };

  const menuItems = [
    {
      id: 1,
      icon: <HomeIcon className="h-5 w-5" />,
      label: "Inicio",
    },
    {
      id: 2,
      icon: <AcademicCapIcon className="h-5 w-5" />,
      label: "Académico",
      subItems: [
        { id: 21, label: "Aprendizajes" },
        { id: 22, label: "Conceptos" },
        { id: 23, label: "Lista de chequeo" },
      ],
    },
    {
      id: 3,
      icon: <DocumentCheckIcon className="h-5 w-5" />,
      label: "Evaluación",
    },
    {
      id: 4,
      icon: <DocumentArrowDownIcon className="h-5 w-5" />,
      label: "Informes",
    },
    {
      id: 5,
      icon: <ShieldCheckIcon className="h-5 w-5" />,
      label: "Gestión",
      subItems: [
        { id: 51, label: "Usuarios" },
        { id: 52, label: "Consolidados" },
      ],
    },
  ];

  // Style variables
  const activeClass = "!bg-purple-700 shadow-lg text-white";
  const hoverClass = "hover:bg-purple-600 hover:text-white hover:rounded-lg";
  const inactiveClass = "text-purple-300";

  return (
    <div
      className={`fixed top-0 left-0 h-screen z-40 transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <Card
        shadow={false}
        className="h-screen w-full max-w-[20rem] px-4 py-1 shadow-xl text-white shadow-purple-700/50 rounded-none"
        style={{ background: 'linear-gradient(4.01deg, #290460 19.26%, #620DD1 97.65%)' }}
      >
        <div className="mb-2 flex items-center gap-3 px-2 py-4">
          <img src={aqWhite} alt="brand" className="h-10 w-10" />
          <h1 className="font-space text-[27px] text-white">QUARTZ</h1>
          <IconButton variant="text" size="sm" className="ml-auto text-purple-400 hover:text-white hover:bg-purple-700" onClick={toggleSidebar}>
            <ChevronLeftIcon strokeWidth={3} className="h-4 w-4" />
          </IconButton>
        </div>
        <List className="mt-4 text-white">
          {menuItems.map((item) => {
            const isChildActive = item.subItems?.some(sub => sub.id === activeItem) ?? false;
            const isAccordionOpen = open === item.id;

            let accordionHeaderClasses = inactiveClass;
            if (isChildActive) {
              accordionHeaderClasses = activeClass;
            } else if (isAccordionOpen) {
              accordionHeaderClasses = "bg-purple-500 text-white";
            }

            return item.subItems ? (
              <Accordion
                key={item.id}
                open={isAccordionOpen}
                icon={<ChevronDownIcon strokeWidth={2.5} 
                className={`mx-auto h-4 w-4 transition-transform group-hover:text-white ${isAccordionOpen ? "rotate-180" : ""} ${isChildActive ? "text-white" : inactiveClass}`} />}
              >
                <ListItem className="p-0 group">
                  <AccordionHeader onClick={() => handleOpen(item.id)} className={`border-b-0 p-3 active:bg-purple-500 ${hoverClass} ${accordionHeaderClasses}`}>
                    <ListItemPrefix className={`group-hover:text-white ${isChildActive ? "text-white" : inactiveClass}`}>
                      {item.icon}
                    </ListItemPrefix>
                    <Typography color="white" className="mr-auto font-normal">
                      {item.label}
                    </Typography>
                  </AccordionHeader>
                </ListItem>
                <AccordionBody className="py-1">
                  <List className="p-0">
                    {item.subItems.map((subItem) => {
                      const isSubItemActive = activeItem === subItem.id;
                      return (
                        <ListItem
                          key={subItem.id}
                          onClick={() => handleActive(subItem.id)}
                          className={`group active:bg-purple-500 ${hoverClass} ${isSubItemActive ? activeClass : inactiveClass}`}
                        >
                          <ListItemPrefix>
                            <ChevronRightIcon strokeWidth={3} className={`h-3 w-5 group-hover:text-white ${isSubItemActive ? "text-white" : inactiveClass}`} />
                          </ListItemPrefix>
                          <Typography color="white" className="font-normal">
                            {subItem.label}
                          </Typography>
                        </ListItem>
                      );
                    })}
                  </List>
                </AccordionBody>
              </Accordion>
            ) : (
              <ListItem
                key={item.id}
                onClick={() => handleActive(item.id)}
                className={`group active:bg-purple-500 ${hoverClass} ${activeItem === item.id ? activeClass : inactiveClass}`}
              >
                <ListItemPrefix className={`group-hover:text-white ${activeItem === item.id ? "text-white" : inactiveClass}`}>
                  {item.icon}
                </ListItemPrefix>
                <Typography color="white" className="font-normal">
                  {item.label}
                </Typography>
              </ListItem>
            );
          })}
        </List>
      </Card>
    </div>
  );
}