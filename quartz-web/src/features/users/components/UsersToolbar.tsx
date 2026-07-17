import {
  Input,
  Typography,
  Button,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Checkbox,
  Chip,
} from "@material-tailwind/react";
import { ChevronDownIcon, FunnelIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import type { GradeLevel } from "@/types/domain";
import type { UserSchool } from "../types";

const GRADE_LEVELS: GradeLevel[] = [
  "Transición", "1ro", "2do", "3ro", "4to", "5to", "6to", "7mo", "8vo", "9no", "10mo", "11mo",
];

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
  const hasFilters = selectedSchools.length > 0 || selectedGrades.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="w-full max-w-sm">
        <Input
          type="text"
          color="purple"
          label="Buscar por nombre o identificación"
          icon={<MagnifyingGlassIcon className="h-5 w-5" />}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          crossOrigin="anonymous"
        />
      </div>

      <div className="flex gap-4 items-center border border-gray-200 bg-white rounded-xl p-2 px-4 w-fit max-w-full flex-wrap">
        <Typography variant="small" color="blue-gray" className="font-bold flex items-center gap-1">
          <FunnelIcon className="h-5 w-5" />
        </Typography>

        {/* Sede Filter */}
        <Menu dismiss={{ itemPress: false }}>
          <MenuHandler>
            <Button
              variant="outlined"
              size="sm"
              className="flex items-center gap-2 border-gray-300 text-gray-700 font-medium normal-case"
            >
              Sede
              <ChevronDownIcon className="h-3 w-3" />
            </Button>
          </MenuHandler>
          <MenuList className="max-h-72 overflow-y-auto">
            {schools.map((school) => (
              <MenuItem key={school._id} className="p-0">
                <label
                  htmlFor={`filter-school-${school._id}`}
                  className="flex cursor-pointer items-center gap-2 p-2 hover:bg-gray-100 w-full"
                >
                  <Checkbox
                    crossOrigin={undefined}
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
              </MenuItem>
            ))}
          </MenuList>
        </Menu>

        {/* Grado Filter */}
        <Menu dismiss={{ itemPress: false }}>
          <MenuHandler>
            <Button
              variant="outlined"
              size="sm"
              className="flex items-center gap-2 border-gray-300 text-gray-700 font-medium normal-case"
            >
              Grado
              <ChevronDownIcon className="h-3 w-3" />
            </Button>
          </MenuHandler>
          <MenuList className="max-h-72 overflow-y-auto">
            {GRADE_LEVELS.map((grade) => (
              <MenuItem key={grade} className="p-0">
                <label
                  htmlFor={`filter-grade-${grade}`}
                  className="flex cursor-pointer items-center gap-2 p-2 hover:bg-gray-100 w-full"
                >
                  <Checkbox
                    crossOrigin={undefined}
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
              </MenuItem>
            ))}
          </MenuList>
        </Menu>

        {/* Badges Row */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 items-center pl-4">
            <Typography variant="small" className="text-gray-500 font-normal mr-1">
              Filtrado por:
            </Typography>
            {selectedSchools.map((id) => {
              const school = schools.find((s) => s._id === id);
              return school ? (
                <Chip
                  key={id}
                  value={school.name}
                  onClose={() => onToggleSchool(id)}
                  variant="ghost"
                  color="blue"
                  size="sm"
                  className="rounded-full"
                />
              ) : null;
            })}
            {selectedGrades.map((grade) => (
              <Chip
                key={grade}
                value={grade}
                onClose={() => onToggleGrade(grade)}
                variant="ghost"
                color="purple"
                size="sm"
                className="rounded-full"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
