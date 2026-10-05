import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsHeader, Tab } from "@material-tailwind/react";
import { UserIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import IndividualReportsPanel from "../components/IndividualReportsPanel";
import ConsolidatedReportsPanel from "../components/ConsolidatedReportsPanel";
import { useUsersQuery } from "../../users/queries/useUsersQuery";
import { usePermissions } from "../../auth/usePermissions";
import SearchFilterBar, { type FilterGroup } from "../../../components/common/SearchFilterBar";
import { useTableFilters } from "@/stores/useTableFiltersStore";
import type { UserDto, UserSchool } from "../../users/types";
import type { GradeLevel } from "@/types/domain";

// Fase actual del sistema: solo Grado Transición (ver CLAUDE.md raíz).
const GRADE_LEVELS: GradeLevel[] = ["Transición"];

const TABS = [
  { value: "individual", label: "Individual", icon: UserIcon },
  { value: "consolidado", label: "Consolidado", icon: UserGroupIcon },
] as const;

type ReportsTab = (typeof TABS)[number]["value"];

const NO_USERS: UserDto[] = [];
// Misma key que `IndividualReportsPanel` y `/evaluacion`: React Query deduplica la request.
const STUDENTS_QUERY = { role: "Estudiante" } as const;

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportsTab>("individual");
  const { data: users = NO_USERS } = useUsersQuery(STUDENTS_QUERY);
  const { isAreaLead, schoolId } = usePermissions();

  // Dueña de la tabla "reports": búsqueda y filtros sobreviven a la navegación (store de UI, en
  // memoria). `IndividualReportsPanel` lee la página del mismo `TableId`.
  const table = useTableFilters("reports");
  const { search, initDefaults } = table;
  const selectedGrades = table.selectedOf("grade");
  const selectedSchools = table.selectedOf("school");

  const isIndividual = activeTab === "individual";

  const schools = useMemo(() => {
    const bySchoolId = new Map<string, UserSchool>();
    users.forEach((user) => bySchoolId.set(user.school._id, user.school));
    return Array.from(bySchoolId.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  // Default de sede propia del Jefe de Área: una vez por sesión; si la quita, no se re-aplica.
  useEffect(() => {
    if (!isAreaLead || !schoolId || schools.length === 0) return;
    initDefaults(schools.some((s) => s._id === schoolId) ? { school: [schoolId] } : {});
  }, [isAreaLead, schoolId, schools, initDefaults]);

  const filterGroups: FilterGroup[] = [
    {
      id: "grade",
      label: "Grado",
      options: GRADE_LEVELS.map((grade) => ({ value: grade, label: grade })),
      selected: selectedGrades,
      onToggle: table.toggle("grade"),
    },
    ...(isAreaLead
      ? [
          {
            id: "school",
            label: "Sede",
            options: schools.map((school) => ({ value: school._id, label: school.name })),
            selected: selectedSchools,
            onToggle: table.toggle("school"),
          } satisfies FilterGroup,
        ]
      : []),
  ];

  return (
    <div className="w-full relative">
      <h1 className="text-2xl font-semibold text-purple-900">Informes</h1>
      <p className="mt-1 text-sm text-gray-600">
        Consulta y descarga la Lista de Chequeo y la Carta Comunicativa de tus estudiantes.
      </p>

      {/* <Tabs> envuelve SOLO la cabecera: su propio div raíz trae `overflow-hidden` fijo en el
          tema (no solo TabsBody/TabPanel), así que cualquier contenido con popovers no
          portalados (Select de Material Tailwind incluido) debe vivir FUERA de él, como
          hermano, o queda recortado sin importar el alto que se le dé. Mismo patrón que
          UsersPage.tsx, que tampoco usa TabsBody/TabPanel. */}
      <Tabs value={activeTab}>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <TabsHeader className="bg-purple-50/60 p-1.5 w-fit shrink-0">
            {TABS.map(({ value, label, icon: Icon }) => {
              const isActive = activeTab === value;
              return (
                <Tab
                  key={value}
                  value={value}
                  onClick={() => setActiveTab(value)}
                  className="px-8 py-2 transition-transform duration-150 active:scale-[0.98]"
                >
                  <div
                    className={`flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                      isActive ? "text-purple-900" : "text-gray-600"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </div>
                </Tab>
              );
            })}
          </TabsHeader>

          <div
            className={`min-w-0 flex-1 overflow-hidden transition-all duration-300 ease-out ${
              isIndividual ? "max-w-full opacity-100" : "max-w-0 opacity-0"
            }`}
            aria-hidden={!isIndividual}
          >
            <div className="min-w-[280px]">
              <SearchFilterBar
                search={search}
                onSearchChange={table.setSearch}
                placeholder="Buscar por nombre o identificación"
                groups={filterGroups}
              />
            </div>
          </div>
        </div>
      </Tabs>

      <div className="pt-6">
        {isIndividual ? (
          <IndividualReportsPanel search={search} selectedGrades={selectedGrades} selectedSchools={selectedSchools} />
        ) : (
          <ConsolidatedReportsPanel />
        )}
      </div>
    </div>
  );
}
