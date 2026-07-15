import { useState } from "react";
import { Tabs, TabsHeader, TabsBody, Tab, TabPanel, Typography } from "@material-tailwind/react";
import { Square3Stack3DIcon } from "@heroicons/react/24/outline";

import { SubjectsPanel } from "../../subject/components/SubjectsPanel";

const TABS = [
  { value: "dimensiones", label: "Dimensiones", icon: Square3Stack3DIcon },
];

export default function ConfigurationPage() {
  const [activeTab, setActiveTab] = useState("dimensiones");

  return (
    <div className="w-full">
      <div className="mb-6">
        <Typography variant="h4" color="blue-gray" className="font-bold">
          Configuración
        </Typography>
        <Typography variant="small" className="text-gray-500">
          Ajustes generales de tu institución en Quartz.
        </Typography>
      </div>

      <Tabs value={activeTab}>
        <TabsHeader className="bg-purple-50/60">
          {TABS.map(({ value, label, icon: Icon }) => (
            <Tab key={value} value={value} onClick={() => setActiveTab(value)}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </div>
            </Tab>
          ))}
        </TabsHeader>
        <TabsBody>
          <TabPanel value="dimensiones" className="px-0 pt-6">
            <SubjectsPanel />
          </TabPanel>
        </TabsBody>
      </Tabs>
    </div>
  );
}
