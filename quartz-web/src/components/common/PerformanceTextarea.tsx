import { Typography, Textarea } from "@material-tailwind/react";
import { ChatBubbleBottomCenterTextIcon } from "@heroicons/react/24/outline";
import type { PerformanceTextareaProps } from "../interfaces/PerformanceTextareaProps";

const DEFAULT_MAX_LENGTH = 2000;
const DEFAULT_ROWS = 4;

export default function PerformanceTextarea({
    title,
    subtitle,
    placeholder = "Escribe aquí...",
    value,
    onChange,
    maxLength = DEFAULT_MAX_LENGTH,
    rows = DEFAULT_ROWS,
    icon,
    disabled = false,
}: PerformanceTextareaProps) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 transition-colors duration-200 hover:border-gray-300">
            <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50">
                    {icon ?? <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-purple-600" />}
                </div>
                <div>
                    <Typography variant="h6" color="blue-gray" className="font-bold leading-tight">
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="small" className="text-gray-500 text-xs">
                            {subtitle}
                        </Typography>
                    )}
                </div>
            </div>
            <Textarea
                color="purple"
                label={placeholder}
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
                rows={rows}
            />
            <Typography variant="small" className="mt-1 text-right text-[11px] text-gray-400">
                {value.length}/{maxLength}
            </Typography>
        </div>
    );
}
