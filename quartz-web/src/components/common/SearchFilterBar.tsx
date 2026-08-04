import {
  Typography,
  Menu,
  MenuHandler,
  MenuList,
  Checkbox,
} from "@material-tailwind/react";
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
import { XMarkIcon } from "@heroicons/react/24/solid";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
}

export interface SearchFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  groups?: FilterGroup[];
  className?: string;
}

const MENU_ANIMATION = {
  mount: { scale: 1, opacity: 1, transition: { duration: 0.15, ease: "easeOut" } },
  unmount: { scale: 0.95, opacity: 0, transition: { duration: 0.1, ease: "easeIn" } },
};

const GRID_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
};

const MENU_WIDTH: Record<number, string> = {
  1: "w-[16rem]",
  2: "w-[26rem]",
  3: "w-[34rem]",
};

export default function SearchFilterBar({
  search,
  onSearchChange,
  placeholder = "Buscar",
  groups = [],
  className = "w-full max-w-xl min-w-0 flex-1",
}: SearchFilterBarProps) {
  const activeFilterCount = groups.reduce((n, g) => n + g.selected.length, 0);
  const hasFilters = activeFilterCount > 0;
  const hasGroups = groups.length > 0;
  const columnCount = Math.min(groups.length, 3) || 1;

  const clearFilters = () => {
    groups.forEach((group) => group.selected.forEach(group.onToggle));
  };

  return (
    <div className={className}>
      <div className="relative flex items-center rounded-full border border-gray-200 bg-white py-1.5 pl-4 pr-1.5 shadow-sm transition-[border-color,box-shadow] duration-150 focus-within:border-purple-300 focus-within:shadow-md">
        <MagnifyingGlassIcon className="h-5 w-5 shrink-0 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-w-0 flex-1 border-none bg-transparent px-3 py-1 text-sm text-gray-700 outline-none placeholder:text-gray-400"
        />

        {hasGroups && (
          <div className="relative shrink-0">
            <Menu placement="bottom-end" animate={MENU_ANIMATION} dismiss={{ itemPress: false }}>
              <MenuHandler>
                <button
                  type="button"
                  aria-label="Filtros"
                  className={`flex h-8 w-8 items-center justify-center rounded-full outline-none transition-[background-color,color,transform,box-shadow] duration-150 focus:outline-none focus-visible:outline-none active:scale-[0.94] ${
                    hasFilters
                      ? "bg-purple-600 text-white shadow-sm shadow-purple-600/30 hover:bg-purple-700"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <AdjustmentsHorizontalIcon className="h-5 w-5" />
                </button>
              </MenuHandler>
              <MenuList
                className={`${MENU_WIDTH[columnCount]} p-3 outline-none focus:outline-none focus-visible:outline-none`}
              >
                <div className={`grid ${GRID_COLS[columnCount]} flex-wrap`}>
                  {groups.map((group, index) => (
                    <div
                      key={group.id}
                      className={`px-4 first:pl-0 last:pr-0 ${
                        index > 0 ? "border-l border-gray-100" : ""
                      }`}
                    >
                      <Typography variant="small" className="px-1 pb-1 font-semibold text-gray-500">
                        {group.label}
                      </Typography>
                      <div className="px-1">
                        {group.options.map((option) => (
                          <label
                            key={option.value}
                            htmlFor={`filter-${group.id}-${option.value}`}
                            className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 hover:bg-gray-50"
                          >
                            <Checkbox
                              crossOrigin="anonymous"
                              id={`filter-${group.id}-${option.value}`}
                              ripple={false}
                              className="hover:before:opacity-0"
                              containerProps={{ className: "p-0" }}
                              checked={group.selected.includes(option.value)}
                              onChange={() => group.onToggle(option.value)}
                            />
                            <Typography color="blue-gray" className="font-normal">
                              {option.label}
                            </Typography>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
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
        )}
      </div>
    </div>
  );
}
