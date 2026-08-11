/** Mirrors backend task enums. */

export const TASK_AREAS = ["COMMON_AREA", "IN_SUITE"] as const;
export type TaskArea = (typeof TASK_AREAS)[number];

export const TASK_TYPES = ["EMERGENCY", "URGENT", "NON_URGENT"] as const;
export type TaskType = (typeof TASK_TYPES)[number];

/** Per backend: first group maps to TaskType.EMERGENCY */
export const EMERGENCY_SUB_TYPES = [
  "ACTIVE_WATER_LEAK",
  "FLOODS",
  "ELEVATOR_MALFUNCTION",
  "ELEVATOR_ENTRAPMENT",
  "FIRE_PANEL_SIGNAL",
  "BREAK_INS",
  "GARAGE",
  "GATE_MALFUNCTION",
  "MAIN_ACCESS_DOOR_MALFUNCTION",
  "MEDICAL",
  "POWER_OUTAGE",
  "SINK_BACKUP",
  "BOILER_ISSUE",
  "AC_HEAT_PUMP_ISSUE",
] as const;

/** Per backend: second group maps to TaskType.URGENT */
export const URGENT_SUB_TYPES = [
  "ACCESS_NEEDED",
  "BIO_HAZARD_CLEANING",
  "SAFETY_HAZARD",
  "FIRE_HAZARD",
  "INTRUDING",
  "ACCESS_CONTROL_ISSUE",
  "PASSIVE_LEAK",
  "MECHANICAL_NOISE",
  "HEATING_AND_COOLING_ISSUE",
  "SMOKE_DETECTOR_ALARM",
  "OTHER",
] as const;

export type TaskSubType =
  | (typeof EMERGENCY_SUB_TYPES)[number]
  | (typeof URGENT_SUB_TYPES)[number];

export const TASK_COMMUNICATION_MODES = [
  "EMAIL",
  "TEXT",
  "IN_PERSON",
  "PHONE_CALL",
] as const;
export type TaskCommunicationMode = (typeof TASK_COMMUNICATION_MODES)[number];

export const TASK_REPORTED_BY = [
  "BUILDING_MANAGER",
  "CONCIERGE",
  "RESIDENT",
  "SUPERVISOR",
  "STRATA_MANAGER",
  "COUNCIL_MANAGER",
  "GENERAL_MANAGER",
  "TRADE",
  "VISITOR",
  "CITY",
  "DEVELOPER",
] as const;
export type TaskReportedBy = (typeof TASK_REPORTED_BY)[number];

/** Follow-up method values accepted by task follow-up API (do not send IN_PERSON). */
export const FOLLOW_UP_METHODS = ["PHONE_CALL", "EMAIL", "TEXT"] as const;
export type FollowUpMethod = (typeof FOLLOW_UP_METHODS)[number];

const fmt = (s: string) =>
  s
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");

export const TASK_AREA_OPTIONS: { value: TaskArea; label: string }[] = [
  { value: "COMMON_AREA", label: "Common area" },
  { value: "IN_SUITE", label: "In-suite" },
];

export const TASK_TYPE_OPTIONS: { value: TaskType; label: string }[] = [
  { value: "EMERGENCY", label: "Emergency" },
  { value: "URGENT", label: "Urgent" },
  { value: "NON_URGENT", label: "Non-urgent" },
];

export const TASK_MODE_OPTIONS: { value: TaskCommunicationMode; label: string }[] = [
  { value: "EMAIL", label: "Email" },
  { value: "TEXT", label: "Text" },
  { value: "IN_PERSON", label: "In person" },
  { value: "PHONE_CALL", label: "Phone call" },
];

export const TASK_REPORTED_BY_OPTIONS: { value: TaskReportedBy; label: string }[] =
  TASK_REPORTED_BY.map((value) => ({ value, label: fmt(value) }));

export const FOLLOW_UP_METHOD_OPTIONS: {
  value: FollowUpMethod;
  label: string;
}[] = [
  { value: "PHONE_CALL", label: "Phonecall" },
  { value: "EMAIL", label: "Email" },
  { value: "TEXT", label: "Text" },
];

export const SUB_TYPE_LABELS: Record<string, string> = {};
[...EMERGENCY_SUB_TYPES, ...URGENT_SUB_TYPES].forEach((st) => {
  SUB_TYPE_LABELS[st] = fmt(st);
});

export function getSubTypeOptionsForTaskType(
  taskType: TaskType | undefined
): { value: TaskSubType; label: string }[] {
  if (taskType === "EMERGENCY") {
    return EMERGENCY_SUB_TYPES.map((value) => ({
      value,
      label: SUB_TYPE_LABELS[value] ?? value,
    }));
  }
  if (taskType === "URGENT") {
    return URGENT_SUB_TYPES.map((value) => ({
      value,
      label: SUB_TYPE_LABELS[value] ?? value,
    }));
  }
  return [];
}

export function isValidSubTypeForTaskType(
  taskType: TaskType | undefined,
  subType: string | undefined | null
): boolean {
  if (!taskType || !subType) return false;
  if (taskType === "EMERGENCY")
    return (EMERGENCY_SUB_TYPES as readonly string[]).includes(subType);
  if (taskType === "URGENT")
    return (URGENT_SUB_TYPES as readonly string[]).includes(subType);
  return false;
}
