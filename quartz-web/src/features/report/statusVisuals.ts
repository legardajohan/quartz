import achievedSvg from "../../assets/images/achieved-icon.svg";
import inProcessSvg from "../../assets/images/in-process-icon.svg";
import withDifficultySvg from "../../assets/images/with-dificulty-icon.svg";
import achievedJpg from "../../assets/images/achieved-icon.jpg";
import inProcessJpg from "../../assets/images/in-process-icon.jpg";
import withDifficultyJpg from "../../assets/images/with-dificulty-icon.jpg";
import type { QualitativeValuation } from "./types";

export const STATUS_ICON_SVG: Record<QualitativeValuation, string> = {
  "Logrado": achievedSvg,
  "En proceso": inProcessSvg,
  "Con dificultad": withDifficultySvg,
};

export const STATUS_ICON_JPG: Record<QualitativeValuation, string> = {
  "Logrado": achievedJpg,
  "En proceso": inProcessJpg,
  "Con dificultad": withDifficultyJpg,
};
