import { ModuleItem } from "@/src/types/auth.types";

/** Preferred display order under Settings */
const ACCOUNT_MENU_ORDER = [
  "user management",
  "master management",
  "routine checklist template",
  "routine checklist templates",
  "checklist template",
  "checklist templates",
] as const;

const EXCLUDED_CODES = new Set([
  "PROF",
  "TC",
  "TI",
  "OI",
  "PAI",
  "VP",
  "AD",
  "V",
  "EC",
  "RENT",
]);

/** Employee / Role / Building → User Management */
const USER_MGMT_PATHS = new Set([
  "/staff-management",
  "/role-management",
  "/building-management",
]);

/** Category / Task Status / Amenity / Tower → Master Management */
const MASTER_MGMT_PATHS = new Set([
  "/category-management",
  "/task-status-management",
  "/amenity-management",
  "/tower-management",
]);

/** Daily / Weekly / Monthly / Annual → Routine Checklist Template */
const ROUTINE_CHECKLIST_TEMPLATE_PATHS = new Set([
  "/daily-checklist-template",
  "/weekly-checklist-template",
  "/monthly-checklist-template",
  "/annual-checklist-template",
]);

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeModulePath(path: string | null | undefined): string {
  if (!path) return "";
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return withSlash.replace(/\/$/, "") || "/";
}

function isExcluded(item: ModuleItem): boolean {
  return EXCLUDED_CODES.has(item.code);
}

function isChecklistTemplatePath(path: string | null | undefined): boolean {
  const p = normalizeModulePath(path);
  if (!p) return false;
  if (ROUTINE_CHECKLIST_TEMPLATE_PATHS.has(p)) return true;
  return p.includes("checklist-template");
}

export function isSettingsManagedPath(path: string | null | undefined): boolean {
  const p = normalizeModulePath(path);
  if (!p) return false;
  if (USER_MGMT_PATHS.has(p) || MASTER_MGMT_PATHS.has(p)) return true;
  return isChecklistTemplatePath(p);
}

export function isAccountMenuModule(item: ModuleItem): boolean {
  const name = normalizeName(item.name);
  const path = (item.path || "").toLowerCase();

  if (
    name === "user management" ||
    name === "master management" ||
    name === "checklist template" ||
    name === "checklist templates" ||
    name === "routine checklist template" ||
    name === "routine checklist templates"
  ) {
    return true;
  }

  if (name.includes("checklist") && name.includes("template")) {
    return true;
  }

  if (path.includes("checklist-template")) {
    return true;
  }

  if (
    item.moduleList?.some((child) => {
      const childPath = (child.path || "").toLowerCase();
      const childName = normalizeName(child.name);
      return (
        childPath.includes("checklist-template") ||
        (childName.includes("checklist") && childName.includes("template"))
      );
    })
  ) {
    return (
      name.includes("checklist") ||
      name.includes("routine") ||
      name.includes("template")
    );
  }

  return false;
}

export function isSettingsParentModule(item: ModuleItem): boolean {
  return normalizeName(item.name) === "settings";
}

/** Hide from Home Quick Actions (and any main nav equivalent) */
export function isHiddenFromHome(item: ModuleItem): boolean {
  if (isExcluded(item)) return true;
  if (isSettingsParentModule(item) || isAccountMenuModule(item)) return true;
  if (isSettingsManagedPath(item.path)) return true;
  return false;
}

function collectLeaves(modules: ModuleItem[], out: ModuleItem[]): void {
  for (const item of modules) {
    if (isExcluded(item)) continue;
    if (item.moduleList?.length) {
      collectLeaves(item.moduleList, out);
      continue;
    }
    if (item.path) out.push(item);
  }
}

function makeGroup(
  name: string,
  code: string,
  icon: string,
  children: ModuleItem[],
): ModuleItem {
  return {
    subscriptionId: null,
    subscriptionName: null,
    discountPercentage: null,
    level: null,
    appointmentCount: null,
    isActive: true,
    name,
    icon,
    path: null,
    code,
    moduleList: children,
  };
}

function sortAccountMenuModules(modules: ModuleItem[]): ModuleItem[] {
  return [...modules].sort((a, b) => {
    const ai = ACCOUNT_MENU_ORDER.indexOf(
      normalizeName(a.name) as (typeof ACCOUNT_MENU_ORDER)[number],
    );
    const bi = ACCOUNT_MENU_ORDER.indexOf(
      normalizeName(b.name) as (typeof ACCOUNT_MENU_ORDER)[number],
    );
    const aRank = ai === -1 ? 100 : ai;
    const bRank = bi === -1 ? 100 : bi;
    if (aRank !== bRank) return aRank - bRank;
    const aIsChecklist = normalizeName(a.name).includes("checklist");
    const bIsChecklist = normalizeName(b.name).includes("checklist");
    if (aIsChecklist !== bIsChecklist) return aIsChecklist ? 1 : -1;
    return 0;
  });
}

/**
 * Modules under Profile → Settings.
 * Rebuilds User / Master / Routine & Checklist Template groups from known paths
 * so grouping is stable even when the backend tree is flat or differently nested.
 */
export function getAccountMenuModules(modules: ModuleItem[]): ModuleItem[] {
  const leaves: ModuleItem[] = [];
  collectLeaves(modules, leaves);

  const userChildren = leaves.filter((m) =>
    USER_MGMT_PATHS.has(normalizeModulePath(m.path)),
  );
  const masterChildren = leaves.filter((m) =>
    MASTER_MGMT_PATHS.has(normalizeModulePath(m.path)),
  );
  const routineTemplateChildren = leaves.filter((m) =>
    ROUTINE_CHECKLIST_TEMPLATE_PATHS.has(normalizeModulePath(m.path)),
  );
  // Any other checklist-template leaf not already in the routine set
  const checklistTemplateChildren = leaves.filter((m) => {
    const p = normalizeModulePath(m.path);
    return (
      isChecklistTemplatePath(p) && !ROUTINE_CHECKLIST_TEMPLATE_PATHS.has(p)
    );
  });

  const out: ModuleItem[] = [];
  if (userChildren.length > 0) {
    out.push(
      makeGroup("User Management", "USER_MGMT_GROUP", "Users", userChildren),
    );
  }
  if (masterChildren.length > 0) {
    out.push(
      makeGroup(
        "Master Management",
        "MASTER_MGMT_GROUP",
        "Settings",
        masterChildren,
      ),
    );
  }
  if (routineTemplateChildren.length > 0) {
    out.push(
      makeGroup(
        "Routine Checklist Template",
        "ROUTINE_CHECKLIST_TEMPLATE_GROUP",
        "ClipboardList",
        routineTemplateChildren,
      ),
    );
  }
  if (checklistTemplateChildren.length > 0) {
    out.push(
      makeGroup(
        "Checklist Template",
        "CHECKLIST_TEMPLATE_GROUP",
        "ClipboardCheck",
        checklistTemplateChildren,
      ),
    );
  }

  return sortAccountMenuModules(out);
}
