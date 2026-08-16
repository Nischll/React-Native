import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  compactNameParams,
  PDF_ROLE_NAME_DEFAULTS,
} from "@/src/helper/pdfClosingNames";
import {
  OcpSignatures,
} from "@/src/types/overnightConciergePatrol.types";

const STORAGE_KEY = "ocp.signatures.v1";

export const OCP_SIGNATURE_STORAGE_DEFAULTS: OcpSignatures = {
  nightConcierge: "",
  ...PDF_ROLE_NAME_DEFAULTS,
};

export async function loadOcpSignatures(): Promise<OcpSignatures> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...OCP_SIGNATURE_STORAGE_DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<OcpSignatures>;
    return {
      ...OCP_SIGNATURE_STORAGE_DEFAULTS,
      ...parsed,
      nightConcierge: parsed.nightConcierge ?? "",
    };
  } catch {
    return { ...OCP_SIGNATURE_STORAGE_DEFAULTS };
  }
}

export async function saveOcpSignatures(
  signatures: OcpSignatures,
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(signatures));
}

/** Query params for the daily PDF — omit blank names so the backend fills them. */
export function ocpSignatureQueryParams(
  signatures: OcpSignatures,
): Record<string, string> {
  return compactNameParams({
    nightConcierge: signatures.nightConcierge,
    operationsSupervisor: signatures.operationsSupervisor,
    operationsManager: signatures.operationsManager,
    generalManager: signatures.generalManager,
    director: signatures.director,
  });
}
