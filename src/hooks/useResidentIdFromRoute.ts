import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

function firstParam(value?: string | string[]): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

/** Prefills unit from `?residentId=` (resident add/edit / details deep link). */
export function useResidentIdFromRoute() {
  const params = useLocalSearchParams<{ residentId?: string | string[] }>();
  const fromRoute = firstParam(params.residentId);
  const [residentId, setResidentId] = useState<string | undefined>(fromRoute);

  useEffect(() => {
    if (fromRoute) setResidentId(fromRoute);
  }, [fromRoute]);

  return {
    residentId,
    setResidentId,
    lockedFromParam: !!fromRoute,
  };
}
