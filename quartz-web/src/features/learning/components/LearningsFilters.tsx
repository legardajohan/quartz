import {
    Typography,
    Button,
    Menu,
    MenuHandler,
    MenuList,
    MenuItem,
    Checkbox,
    Chip,
} from "@material-tailwind/react";
import { ChevronDownIcon, FunnelIcon } from "@heroicons/react/24/outline";

interface FilterOption {
    _id: string;
    name: string;
}

interface LearningsFiltersProps {
    periods: FilterOption[];
    subjects: FilterOption[];
    selectedPeriods: string[];
    selectedSubjects: string[];
    onTogglePeriod: (periodId: string) => void;
    onToggleSubject: (subjectId: string) => void;
}

export function LearningsFilters({
    periods,
    subjects,
    selectedPeriods,
    selectedSubjects,
    onTogglePeriod,
    onToggleSubject,
}: LearningsFiltersProps) {

    const hasFiltersCallback = () => selectedPeriods.length > 0 || selectedSubjects.length > 0;
    const hasFilters = hasFiltersCallback();

    return (
        <div className="flex flex-col gap-4">
            {/* Filters Row */}
            <div className="flex gap-4 items-center border border-gray-200 bg-white rounded-xl p-2 px-4 w-fit max-w-full flex-wrap">
                <Typography variant="small" color="blue-gray" className="font-bold flex items-center gap-1">
                    <FunnelIcon className="h-5 w-5" />
                </Typography>

                {/* Period Filter */}
                <Menu dismiss={{ itemPress: false }}>
                    <MenuHandler>
                        <Button
                            variant="outlined"
                            size="sm"
                            className="flex items-center gap-2 border-gray-300 text-gray-700 font-medium normal-case"
                        >
                            Periodo
                            <ChevronDownIcon className="h-3 w-3" />
                        </Button>
                    </MenuHandler>
                    <MenuList className="max-h-72">
                        {periods.map((period) => (
                            <MenuItem key={period._id} className="p-0">
                                <label
                                    htmlFor={`filter-period-${period._id}`}
                                    className="flex cursor-pointer items-center gap-2 p-2 hover:bg-gray-100 w-full"
                                >
                                    <Checkbox
                                        crossOrigin={undefined}
                                        id={`filter-period-${period._id}`}
                                        ripple={false}
                                        className="hover:before:opacity-0"
                                        containerProps={{
                                            className: "p-0",
                                        }}
                                        checked={selectedPeriods.includes(period._id)}
                                        onChange={() => onTogglePeriod(period._id)}
                                    />
                                    <Typography color="blue-gray" className="font-normal">
                                        {period.name}
                                    </Typography>
                                </label>
                            </MenuItem>
                        ))}
                    </MenuList>
                </Menu>

                {/* Subject Filter */}
                <Menu dismiss={{ itemPress: false }}>
                    <MenuHandler>
                        <Button
                            variant="outlined"
                            size="sm"
                            className="flex items-center gap-2 border-gray-300 text-gray-700 font-medium normal-case"
                        >
                            Dimensión
                            <ChevronDownIcon className="h-3 w-3" />
                        </Button>
                    </MenuHandler>
                    <MenuList className="max-h-72 overflow-y-auto">
                        {subjects.map((subject) => (
                            <MenuItem key={subject._id} className="p-0">
                                <label
                                    htmlFor={`filter-subject-${subject._id}`}
                                    className="flex cursor-pointer items-center gap-2 p-2 hover:bg-gray-100 w-full"
                                >
                                    <Checkbox
                                        crossOrigin={undefined}
                                        id={`filter-subject-${subject._id}`}
                                        ripple={false}
                                        className="hover:before:opacity-0"
                                        containerProps={{
                                            className: "p-0",
                                        }}
                                        checked={selectedSubjects.includes(subject._id)}
                                        onChange={() => onToggleSubject(subject._id)}
                                    />
                                    <Typography color="blue-gray" className="font-medium">
                                        {subject.name}
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
                        {selectedPeriods.map((id) => {
                            const period = periods.find((p) => p._id === id);
                            return period ? (
                                <Chip
                                    key={id}
                                    value={period.name}
                                    onClose={() => onTogglePeriod(id)}
                                    variant="ghost"
                                    color="blue"
                                    size="sm"
                                    className="rounded-full"
                                />
                            ) : null;
                        })}
                        {selectedSubjects.map((id) => {
                            const subject = subjects.find((s) => s._id === id);
                            return subject ? (
                                <Chip
                                    key={id}
                                    value={subject.name}
                                    onClose={() => onToggleSubject(id)}
                                    variant="ghost"
                                    color="cyan"
                                    size="sm"
                                    className="rounded-full"
                                />
                            ) : null;
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
