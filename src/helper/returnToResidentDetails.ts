import { router } from "expo-router";

/** After owner/tenant/etc. save — return to the resident details screen. */
export function returnToResidentDetails(
  residentId?: string | number | null,
): boolean {
  if (residentId == null || residentId === "") return false;
  const id = String(residentId).trim();
  if (!id || Number.isNaN(Number(id))) return false;

  router.replace({
    pathname: "/(private)/resident-management/resident-details",
    params: { residentId: id },
  });
  return true;
}
