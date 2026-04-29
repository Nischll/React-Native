/**
 * Mirrors backend enums in com.cord.aml.enums (BuildingImprovementProject, BuildingImprovementSubProject, ImprovementImageSide).
 * Multipart field names for create/update should match BuildingImprovementRequestPojo (buildingId, project, subProject, location, workDate, detailOfWork, beforeImages, afterImages).
 */

export const BUILDING_IMPROVEMENT_PROJECTS = [
  "PRESSURE_WASHING",
  "HANDYMAN_REPAIRS",
  "TROUBLESHOOTINGS",
  "PAINTING_AND_PATCHING_LOCATION",
  "CHANGING_LIGHT_BULB",
  "MECHANICAL_ROOM_CLEANING",
  "ORGANIZATION",
  "GARBAGE_ROOM_MAINTENANCE",
  "STORAGE_ROOM_AND_PARKING_AREAS",
  "GENERAL_CLEANING_CARETAKER",
  "FACILITIES_BEFORE_AND_AFTER",
  "SEASONAL_TASK_TRACKING",
] as const;

export type BuildingImprovementProject =
  (typeof BUILDING_IMPROVEMENT_PROJECTS)[number];

export const BUILDING_IMPROVEMENT_SUB_PROJECTS: {
  value: string;
  parent: BuildingImprovementProject;
}[] = [
  { value: "LOBBY", parent: "GENERAL_CLEANING_CARETAKER" },
  { value: "ELEVATOR_FRAME", parent: "GENERAL_CLEANING_CARETAKER" },
  { value: "AMENITIES", parent: "GENERAL_CLEANING_CARETAKER" },
  { value: "P_LEVEL_LOBBIES", parent: "GENERAL_CLEANING_CARETAKER" },
  { value: "FITNESS_ROOM", parent: "GENERAL_CLEANING_CARETAKER" },
  { value: "GENERAL_CLEANING_OTHERS", parent: "GENERAL_CLEANING_CARETAKER" },
  { value: "SWIMMING_POOL", parent: "FACILITIES_BEFORE_AND_AFTER" },
  { value: "HOT_TUB", parent: "FACILITIES_BEFORE_AND_AFTER" },
  { value: "GAMES_ROOM", parent: "FACILITIES_BEFORE_AND_AFTER" },
  { value: "BOWLING_ALLEY", parent: "FACILITIES_BEFORE_AND_AFTER" },
  { value: "SAUNA", parent: "FACILITIES_BEFORE_AND_AFTER" },
  { value: "STEAM_ROOM", parent: "FACILITIES_BEFORE_AND_AFTER" },
  { value: "BASKETBALL_COURT", parent: "FACILITIES_BEFORE_AND_AFTER" },
  { value: "DOG_RUN", parent: "FACILITIES_BEFORE_AND_AFTER" },
  { value: "BBQ_AREA", parent: "FACILITIES_BEFORE_AND_AFTER" },
  { value: "WATER_FEATURES", parent: "FACILITIES_BEFORE_AND_AFTER" },
  { value: "CAR_WASH", parent: "FACILITIES_BEFORE_AND_AFTER" },
  { value: "PET_WASH", parent: "FACILITIES_BEFORE_AND_AFTER" },
  { value: "SALTING", parent: "SEASONAL_TASK_TRACKING" },
  { value: "SNOW_REMOVAL", parent: "SEASONAL_TASK_TRACKING" },
  { value: "LEAF_BLOWING", parent: "SEASONAL_TASK_TRACKING" },
  {
    value: "SKIM_OF_LEAF_FROM_WATER_FEATURES",
    parent: "SEASONAL_TASK_TRACKING",
  },
];

export type BuildingImprovementSubProject =
  (typeof BUILDING_IMPROVEMENT_SUB_PROJECTS)[number]["value"];

export type ImprovementImageSide = "BEFORE" | "AFTER";

export interface BuildingImprovementImageResponse {
  id: number;
  /** API field (preferred) */
  imageSide?: ImprovementImageSide | string;
  /** Legacy / alternate */
  side?: ImprovementImageSide | string;
  /** Relative e.g. `/api/building-improvements/files/1` — resolve with API origin */
  fileUrl?: string;
  storedPath?: string;
  originalFileName?: string;
  fileName?: string;
}

export interface BuildingImprovementResponse {
  id: number;
  buildingId?: number;
  buildingName?: string;
  /** Display name of the user who created the record (list/detail API). */
  createdByUserName?: string | null;
  project: BuildingImprovementProject | string;
  subProject?: BuildingImprovementSubProject | string | null;
  location?: string | null;
  workDate: string;
  detailOfWork: string;
  images?: BuildingImprovementImageResponse[];
}

export function allowsSubProjects(project: string): boolean {
  return (
    project === "GENERAL_CLEANING_CARETAKER" ||
    project === "FACILITIES_BEFORE_AND_AFTER" ||
    project === "SEASONAL_TASK_TRACKING"
  );
}

export function subProjectsForParent(
  project: BuildingImprovementProject | string,
) {
  return BUILDING_IMPROVEMENT_SUB_PROJECTS.filter((s) => s.parent === project);
}

function humanizeEnum(s: string): string {
  return s
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export function projectLabel(project: string): string {
  const map: Record<string, string> = {
    PRESSURE_WASHING: "Pressure washing",
    HANDYMAN_REPAIRS: "Handyman repairs",
    TROUBLESHOOTINGS: "Troubleshooting",
    PAINTING_AND_PATCHING_LOCATION: "Painting and patching (location)",
    CHANGING_LIGHT_BULB: "Changing light bulb",
    MECHANICAL_ROOM_CLEANING: "Mechanical room cleaning",
    ORGANIZATION: "Organization",
    GARBAGE_ROOM_MAINTENANCE: "Garbage room maintenance",
    STORAGE_ROOM_AND_PARKING_AREAS: "Storage room and parking areas",
    GENERAL_CLEANING_CARETAKER: "General cleaning (caretaker)",
    FACILITIES_BEFORE_AND_AFTER: "Facilities (before and after)",
    SEASONAL_TASK_TRACKING: "Seasonal (task tracking)",
  };
  return map[project] ?? humanizeEnum(project);
}

export function subProjectLabel(value: string): string {
  return humanizeEnum(value);
}

/** Fields sent as multipart form (align with BuildingImprovementRequestPojo). */
export type BuildingImprovementMutationPayload = {
  buildingId: number;
  project: string;
  subProject?: string | null;
  location?: string;
  workDate: string;
  detailOfWork: string;
  beforeImages?: File[];
  afterImages?: File[];
};
