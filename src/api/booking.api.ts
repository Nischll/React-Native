import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { BookingRequestPojo, BookingResponse } from "../types/booking.types";
import { BookingAmenityByResidentDateItem } from "../types/prePostInspection.types";
import { ApiListResponse, ApiPaginatedData } from "./auth.api";

export type BookingListParams = {
  page?: number;
  limit?: number;
  buildingId?: number;
  amenityId?: number;
  towerId?: number;
  residentId?: number;
  /** @deprecated prefer startDate — kept for callers */
  fromDate?: string;
  /** @deprecated prefer endDate — kept for callers */
  toDate?: string;
  startDate?: string;
  endDate?: string;
  dateRange?: string;
};

/** Normalize booking list API: backend returns T[] (web calendar), some envs may paginate. */
export function extractBookings(response: unknown): BookingResponse[] {
  if (response == null) return [];
  const root: any = response;
  const payload = root?.data !== undefined ? root.data : root;
  if (Array.isArray(payload)) return payload as BookingResponse[];
  if (payload && Array.isArray(payload.data)) return payload.data as BookingResponse[];
  return [];
}

export const useGetBookings = (
  params: BookingListParams = {},
  enabled = true,
) => {
  const queryParams: Record<string, any> = {};
  if (params.page != null) queryParams.page = params.page;
  if (params.limit != null) queryParams.limit = params.limit;
  if (params.buildingId != null) queryParams.buildingId = params.buildingId;
  if (params.amenityId != null) queryParams.amenityId = params.amenityId;
  if (params.towerId != null) queryParams.towerId = params.towerId;
  if (params.residentId != null) queryParams.residentId = params.residentId;
  if (params.dateRange) queryParams.dateRange = params.dateRange;

  // Backend BookingController expects startDate / endDate (yyyy-MM-dd)
  const start = params.startDate || params.fromDate;
  const end = params.endDate || params.toDate;
  if (start) queryParams.startDate = start;
  if (end) queryParams.endDate = end;

  return useApiQuery<
    | ApiListResponse<BookingResponse[]>
    | ApiListResponse<ApiPaginatedData<BookingResponse>>
  >("/booking", {
    enabled: enabled && params.buildingId != null,
    retry: 0,
    staleTime: 60 * 1000,
    queryParams:
      Object.keys(queryParams).length > 0 ? queryParams : undefined,
  });
};

export const useGetBookingById = (id: number | undefined, enabled = true) =>
  useApiQuery<ApiListResponse<BookingResponse>>(`/booking/${id}`, {
    enabled: enabled && id != null,
    retry: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

export const useAddBooking = () =>
  useApiMutation<BookingRequestPojo>("post", "/booking", {
    successMessage: "Booking created",
  });

export const useUpdateBooking = (id: number | undefined) =>
  useApiMutation<BookingRequestPojo>("put", `/booking/${id}`);

export const useDeleteBooking = () =>
  useApiMutation<{ id: number }>("delete", "/booking");

/** Amenities booked for a resident on a given date (PPI amenity picker). */
export const useGetBookingAmenityByResidentDate = (
  residentId: number | undefined,
  date: string | undefined,
  buildingId?: number,
  enabled = true,
) => {
  const queryParams: Record<string, string | number> = {};
  if (residentId != null) queryParams.residentId = residentId;
  if (date?.trim()) queryParams.date = date.trim();
  if (buildingId != null) queryParams.buildingId = buildingId;

  return useApiQuery<
    | ApiListResponse<BookingAmenityByResidentDateItem[]>
    | ApiListResponse<ApiPaginatedData<BookingAmenityByResidentDateItem>>
  >("/booking/amenity-by-resident-date", {
    enabled:
      enabled &&
      residentId != null &&
      residentId > 0 &&
      !!date?.trim(),
    retry: 0,
    queryParams:
      Object.keys(queryParams).length > 0 ? queryParams : undefined,
  });
};
