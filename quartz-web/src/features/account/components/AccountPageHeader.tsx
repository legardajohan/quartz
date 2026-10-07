import { Typography } from "@material-tailwind/react";

export interface AccountPageHeaderProps {
  title: string;
  description: string;
}

export default function AccountPageHeader({ title, description }: AccountPageHeaderProps) {
  return (
    <div className="mb-8">
      <Typography variant="h4" color="blue-gray" className="font-bold">
        {title}
      </Typography>
      <Typography variant="small" className="text-gray-600">
        {description}
      </Typography>
    </div>
  );
}
