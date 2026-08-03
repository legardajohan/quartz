import { useState } from "react";
import { Tabs, TabsHeader, TabsBody, Tab, TabPanel, Typography } from "@material-tailwind/react";
import { Square3Stack3DIcon, CalendarDaysIcon, DocumentTextIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

import { SubjectsPanel } from "../../subject/components/SubjectsPanel";
import { PeriodsPanel } from "../../period/components/PeriodsPanel";
import { ReportSettingsPanel } from "../../institution/components/ReportSettingsPanel";
import { InstitutionShieldPanel } from "../../institution/components/InstitutionShieldPanel";

const STEPS = [
  {
    value: "ejes-valoracion",
    step: 1,
    label: "Ejes de Valoración",
    hint: "Qué evalúas",
    icon: Square3Stack3DIcon,
  },
  {
    value: "periodos",
    step: 2,
    label: "Periodos",
    hint: "Cuándo evalúas",
    icon: CalendarDaysIcon,
  },
  {
    value: "informes",
    step: 3,
    label: "Informes",
    hint: "Qué entregas",
    icon: DocumentTextIcon,
  },
  {
    value: "identidad",
    step: 4,
    label: "Identidad",
    hint: "Cómo te ven",
    icon: ShieldCheckIcon,
  },
] as const;

export default function ConfigurationPage() {
  const [activeTab, setActiveTab] = useState<(typeof STEPS)[number]["value"]>("ejes-valoracion");

  return (
    <div className="w-full">
      <div className="mb-8">
        <Typography variant="h4" color="blue-gray" className="font-bold">
          Configuración
        </Typography>
        <Typography variant="small" className="text-gray-500">
          Configura tu institución en Quartz en cuatro pasos: ejes de valoración, periodos, informes e identidad.
        </Typography>
      </div>

      <Tabs value={activeTab}>
        <TabsHeader className="bg-purple-50/60 p-1.5 max-w-4xl">
          {STEPS.map(({ value, step, label, hint, icon: Icon }) => {
            const isActive = activeTab === value;
            return (
              <Tab
                key={value}
                value={value}
                onClick={() => setActiveTab(value)}
                className="py-2.5 transition-transform duration-150 active:scale-[0.98]"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-200 ${
                      isActive ? "bg-purple-600 text-white" : "bg-white text-gray-600 border border-gray-300"
                    }`}
                  >
                    {step}
                  </span>
                  <div className="flex flex-col items-start leading-tight">
                    <span className={`flex items-center gap-1.5 font-medium ${isActive ? "text-purple-900" : "text-gray-600"}`}>
                      <Icon className="h-4 w-4" />
                      {label}
                    </span>
                    <span className="text-[11px] font-normal text-gray-400">{hint}</span>
                  </div>
                </div>
              </Tab>
            );
          })}
        </TabsHeader>
        <TabsBody>
          <TabPanel value="ejes-valoracion" className="px-0 pt-8">
            <SubjectsPanel />
          </TabPanel>
          <TabPanel value="periodos" className="px-0 pt-8">
            <PeriodsPanel />
          </TabPanel>
          <TabPanel value="informes" className="px-0 pt-8">
            <ReportSettingsPanel />
          </TabPanel>
          <TabPanel value="identidad" className="px-0 pt-8">
            <InstitutionShieldPanel />
          </TabPanel>
        </TabsBody>
      </Tabs>
    </div>
  );
}
