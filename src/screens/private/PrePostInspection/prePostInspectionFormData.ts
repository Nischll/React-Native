import { toTaskAttachmentPart } from "@/src/screens/private/TaskManagement/toTaskAttachmentPart";
import type {
  PrePostInspectionImageMutation,
  PrePostInspectionMutationPayload,
} from "@/src/types/prePostInspection.types";
import {
  IMAGE_AREA_MAX,
  IMAGE_DESCRIPTION_MAX,
} from "@/src/types/prePostInspection.types";

async function appendImageList(
  fd: FormData,
  amenityIndex: number,
  side: "preImages" | "postImages",
  images: PrePostInspectionImageMutation[],
) {
  for (let j = 0; j < images.length; j++) {
    const img = images[j];
    const base = `amenities[${amenityIndex}].${side}[${j}]`;
    if (img.id != null) fd.append(`${base}.id`, String(img.id));
    if (img.file?.isLocal) {
      const part = await toTaskAttachmentPart({
        uri: img.file.uri,
        name: img.file.name,
        mimeType: img.file.mimeType,
      });
      fd.append(`${base}.file`, part as any);
    }
    fd.append(`${base}.area`, (img.area ?? "").slice(0, IMAGE_AREA_MAX));
    fd.append(
      `${base}.description`,
      (img.description ?? "").slice(0, IMAGE_DESCRIPTION_MAX),
    );
  }
}

/** Build multipart FormData matching web/backend field names. */
export async function buildPrePostInspectionFormData(
  p: PrePostInspectionMutationPayload,
): Promise<FormData> {
  const fd = new FormData();
  fd.append("buildingId", String(p.buildingId));
  fd.append("residentId", String(p.residentId));
  if (p.bookingId != null) fd.append("bookingId", String(p.bookingId));
  fd.append("inspectionDate", p.inspectionDate);
  if (p.inspectionTime) fd.append("inspectionTime", p.inspectionTime);
  if (p.status) fd.append("status", String(p.status));
  if (p.depositReturned !== null && p.depositReturned !== undefined) {
    fd.append("depositReturned", String(p.depositReturned));
  }
  if (p.finalResidentSignature) {
    fd.append("finalResidentSignature", p.finalResidentSignature);
  }
  if (p.finalCaretakerSignature) {
    fd.append("finalCaretakerSignature", p.finalCaretakerSignature);
  }
  if (p.notes) fd.append("notes", p.notes);

  for (let i = 0; i < p.amenities.length; i++) {
    const a = p.amenities[i];
    if (a.id != null) fd.append(`amenities[${i}].id`, String(a.id));
    fd.append(`amenities[${i}].amenityId`, String(a.amenityId));
    if (a.residentSignature) {
      fd.append(`amenities[${i}].residentSignature`, a.residentSignature);
    }
    if (a.caretakerSignature) {
      fd.append(`amenities[${i}].caretakerSignature`, a.caretakerSignature);
    }
    if (a.preImages?.length) {
      await appendImageList(fd, i, "preImages", a.preImages);
    }
    if (a.postImages?.length) {
      await appendImageList(fd, i, "postImages", a.postImages);
    }
  }

  return fd;
}
