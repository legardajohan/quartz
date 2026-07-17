import {
  Typography,
  Menu,
  MenuHandler,
  MenuList,
  Checkbox,
} from "@material-tailwind/react";
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
import { XMarkIcon } from "@heroicons/react/24/solid";
import type { GradeLevel } from "@/types/domain";
import type { UserSchool } from "../types";

// Fase actual del sistema: solo Grado Transición (ver CLAUDE.md raíz).
const GRADE_LEVELS: GradeLevel[] = ["Transición"];

const MENU_ANIMATION = {
  mount: { scale: 1, opacity: 1, transition: { duration: 0.15, ease: "easeOut" } },
  unmount: { scale: 0.95, opacity: 0, transition: { duration: 0.1, ease: "easeIn" } },
};

interface UsersToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  schools: UserSchool[];
  selectedSchools: string[];
  onToggleSchool: (schoolId: string) => void;
  selectedGrades: GradeLevel[];
  onToggleGrade: (grade: GradeLevel) => void;
}

export function UsersToolbar({
  search,
  onSearchChange,
  schools,
  selectedSchools,
  onToggleSchool,
  selectedGrades,
  onToggleGrade,
}: UsersToolbarProps) {
  const activeFilterCount = selectedSchools.length + selectedGrades.length;
  const hasFilters = activeFilterCount > 0;

  const clearFilters = () => {
    selectedSchools.forEach(onToggleSchool);
    selectedGrades.forEach(onToggleGrade);
  };

  return (
    <div className="w-full max-w-xl">
      <div className="relative flex items-center rounded-full border border-gray-200 bg-white py-1.5 pl-4 pr-1.5 shadow-sm transition-[border-color,box-shadow] duration-150 focus-within:border-purple-300 focus-within:shadow-md">
        <MagnifyingGlassIcon className="h-5 w-5 shrink-0 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nombre o identificación"
          className="w-full min-w-0 flex-1 border-none bg-transparent px-3 py-1 text-sm text-gray-700 outline-none placeholder:text-gray-400"
        />

        <div className="relative shrink-0">
          <Menu placement="bottom-end" animate={MENU_ANIMATION} dismiss={{ itemPress: false }}>
            <MenuHandler>
              <button
                type="button"
                aria-label="Filtros"
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-[background-color,color,transform,box-shadow] duration-150 active:scale-[0.94] ${
                  hasFilters
                    ? "bg-purple-600 text-white shadow-sm shadow-purple-600/30 hover:bg-purple-700"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
              </button>
            </MenuHandler>
            <MenuList className="w-[26rem] p-3">
              <div className="grid grid-cols-2">
                <div className="pr-4">
                  <Typography variant="small" className="px-1 pb-1 font-semibold text-gray-500">
                    Sede
                  </Typography>
                  <div className="px-1">
                    {schools.map((school) => (
                      <label
                        key={school._id}
                        htmlFor={`filter-school-${school._id}`}
                        className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 hover:bg-gray-50"
                      >
                        <Checkbox
                          crossOrigin="anonymous"
                          id={`filter-school-${school._id}`}
                          ripple={false}
                          className="hover:before:opacity-0"
                          containerProps={{ className: "p-0" }}
                          checked={selectedSchools.includes(school._id)}
                          onChange={() => onToggleSchool(school._id)}
                        />
                        <Typography color="blue-gray" className="font-normal">
                          {school.name}
                        </Typography>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-l border-gray-100 pl-4">
                  <Typography variant="small" className="px-1 pb-1 font-semibold text-gray-500">
                    Grado
                  </Typography>
                  <div className="px-1">
                    {GRADE_LEVELS.map((grade) => (
                      <label
                        key={grade}
                        htmlFor={`filter-grade-${grade}`}
                        className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 hover:bg-gray-50"
                      >
                        <Checkbox
                          crossOrigin="anonymous"
                          id={`filter-grade-${grade}`}
                          ripple={false}
                          className="hover:before:opacity-0"
                          containerProps={{ className: "p-0" }}
                          checked={selectedGrades.includes(grade)}
                          onChange={() => onToggleGrade(grade)}
                        />
                        <Typography color="blue-gray" className="font-normal">
                          {grade}
                        </Typography>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </MenuList>
          </Menu>

          <button
            type="button"
            aria-label="Limpiar filtros"
            onClick={(e) => {
              e.stopPropagation();
              if (hasFilters) clearFilters();
            }}
            tabIndex={hasFilters ? 0 : -1}
            className={`group absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-600 text-[10px] font-bold text-white ring-2 ring-white transition-[opacity,transform] duration-150 ease-out ${
              hasFilters ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0"
            }`}
          >
            <span className="group-hover:hidden">{activeFilterCount}</span>
            <XMarkIcon className="hidden h-2.5 w-2.5 group-hover:block" />
          </button>
        </div>
      </div>
    </div>
  );
}
