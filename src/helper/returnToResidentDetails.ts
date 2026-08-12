import { router } from "expo-router";

export type ResidentReturnTarget = "edit" | "details";

function normalizeResidentId(
  residentId?: string | number | null,
): string | null {
  if (residentId == null || residentId === "") return null;
  const id = String(residentId).trim();
  if (!id || Number.isNaN(Number(id))) return null;
  return id;
}

/** After related-record save or custom back — return to edit or details. */
export function returnToResident(
  residentId?: string | number | null,
  target: ResidentReturnTarget = "edit",
): boolean {
  const id = normalizeResidentId(residentId);
  if (!id) return false;

  router.replace({
    pathname:
      target === "details"
        ? "/(private)/resident-management/resident-details"
        : "/(private)/resident-management/resident-add-edit",
    params: { residentId: id },
  });
  return true;
}

/** @deprecated Prefer returnToResident(residentId, "edit" | "details") */
export function returnToResidentDetails(
  residentId?: string | number | null,
): boolean {
  return returnToResident(residentId, "details");
}
