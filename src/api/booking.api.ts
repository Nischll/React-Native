import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { BookingRequestPojo, BookingResponse } from "../types/booking.types";
import { ApiListResponse, ApiPaginatedData } from "./auth.api";

export const useGetBookings = (
  params: {
    page?: number;
    limit?: number;
    buildingId?: number;
    amenityId?: number;
    towerId?: number;
    residentId?: number;
    fromDate?: string;
    toDate?: string;
  },
  enabled = true,
) => {
  const queryParams: Record<string, any> = {};
  if (params.page != null) queryParams.page = params.page;
  if (params.limit != null) queryParams.limit = params.limit;
  if (params.buildingId != null) queryParams.buildingId = params.buildingId;
  if (params.amenityId != null) queryParams.amenityId = params.amenityId;
  if (params.towerId != null) queryParams.towerId = params.towerId;
  if (params.residentId != null) queryParams.residentId = params.residentId;
  if (params.fromDate) queryParams.fromDate = params.fromDate;
  if (params.toDate) queryParams.toDate = params.toDate;

  return useApiQuery<ApiListResponse<ApiPaginatedData<BookingResponse>>>(
    "/booking",
    {
      enabled: enabled && params.buildingId != null,
      retry: 0,
      queryParams:
        Object.keys(queryParams).length > 0 ? queryParams : undefined,
    },
  );
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
