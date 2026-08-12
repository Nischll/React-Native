import {
  ResidentReturnTarget,
  returnToResident,
} from "@/src/helper/returnToResidentDetails";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";

function firstParam(value?: string | string[]): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

function parseReturnTarget(
  value?: string,
): ResidentReturnTarget | null {
  if (value === "edit" || value === "details") return value;
  return null;
}

/** Prefills unit from `?residentId=` (resident add/edit deep link). */
export function useResidentIdFromRoute() {
  const params = useLocalSearchParams<{
    residentId?: string | string[];
    returnTo?: string | string[];
  }>();
  const fromRoute = firstParam(params.residentId);
  const returnTarget = parseReturnTarget(firstParam(params.returnTo));
  const [residentId, setResidentId] = useState<string | undefined>(fromRoute);

  useEffect(() => {
    if (fromRoute) setResidentId(fromRoute);
  }, [fromRoute]);

  const effectiveReturnTarget = useMemo((): ResidentReturnTarget | null => {
    if (returnTarget) return returnTarget;
    // Legacy: residentId without returnTo still means opened from resident flow
    if (fromRoute) return "edit";
    return null;
  }, [returnTarget, fromRoute]);

  const goBackToResident = () => {
    // Prefer history so Edit Resident stays on the stack (not the list).
    if (effectiveReturnTarget && router.canGoBack()) {
      router.back();
      return;
    }
    if (
      effectiveReturnTarget &&
      returnToResident(residentId ?? fromRoute, effectiveReturnTarget)
    ) {
      return;
    }
    router.back();
  };

  const afterSaveReturn = () => {
    if (!effectiveReturnTarget) return false;
    if (router.canGoBack()) {
      router.back();
      return true;
    }
    return returnToResident(residentId ?? fromRoute, effectiveReturnTarget);
  };

  return {
    residentId,
    setResidentId,
    lockedFromParam: !!fromRoute,
    /** When opened from resident edit/details */
    returnTarget: effectiveReturnTarget,
    /** @deprecated use returnTarget / afterSaveReturn */
    returnToDetails: !!effectiveReturnTarget,
    goBackToResident,
    afterSaveReturn,
  };
}
