import { useNavigate } from "react-router-dom";
import { Avatar, Chip, Typography } from "@material-tailwind/react";
import { AVATAR_FALLBACK } from "@/constants/assets";
import type { IAtRiskStudentRow } from "../types";

interface AtRiskStudentsListProps {
  data: IAtRiskStudentRow[];
}

export function AtRiskStudentsList({ data }: AtRiskStudentsListProps) {
  const navigate = useNavigate();

  return (
    <ul className="divide-y divide-gray-100">
      {data.map((student) => (
        <li key={student.studentId}>
          <button
            type="button"
            onClick={() => navigate(`/evaluacion/${student.studentId}`)}
            className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition duration-150 hover:bg-gray-50 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            <Avatar src={student.avatarUrl || AVATAR_FALLBACK} alt={student.studentName} size="sm" />
            <div className="min-w-0 flex-1">
              <Typography variant="small" color="blue-gray" className="font-medium">
                {student.studentName}
              </Typography>
              <Typography variant="small" className="truncate text-xs font-normal text-gray-500">
                {student.subjectNames.join(" · ")}
              </Typography>
            </div>
            <Chip
              size="sm"
              value={`${student.subjectsWithDificulty} dimensiones`}
              variant="ghost"
              color="red"
              className="shrink-0 normal-case"
            />
          </button>
        </li>
      ))}
    </ul>
  );
}
