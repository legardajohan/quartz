import { Spinner, Typography } from "@material-tailwind/react";

interface LoadingProps {
    fullScreen?: boolean;
    message?: string;
    className?: string;
}

export const Loading = ({
    fullScreen = false,
    message = "Cargando...",
    className = ""
}: LoadingProps) => {
    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm transition-all duration-300">
                <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-xl border border-white/20">
                    <Spinner className="h-12 w-12 text-purple-500/20" color="purple" />
                    <Typography
                        variant="h6"
                        color="blue-gray"
                        className="font-medium animate-pulse"
                    >
                        {message}
                    </Typography>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center justify-center p-8 gap-3 w-full h-full min-h-[200px] ${className}`}>
            <Spinner className="h-10 w-10 text-purple-500/20" color="purple" />
            <Typography
                variant="small"
                color="gray"
                className="font-normal opacity-70"
            >
                {message}
            </Typography>
        </div>
    );
};
