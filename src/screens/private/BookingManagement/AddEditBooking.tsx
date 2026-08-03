import { useGetAmenities } from "@/src/api/amenity.api";
import { useGetTowers } from "@/src/api/tower.api";
import {
  useAddBooking,
  useGetBookingById,
  useUpdateBooking,
} from "@/src/api/booking.api";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import DatePickerField from "@/src/components/ui/DatePickerField";
import SelectField from "@/src/components/ui/SelectField";
import TextAreaField from "@/src/components/ui/TextAreaFeld";
import { useResidencesForActiveBuilding } from "@/src/hooks/useResidenceByBuilding";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  BOOKING_STATUS_OPTIONS,
  BookingStatus,
  PAID_TYPE_OPTIONS,
  PaidType,
  normalizeBookingStatus,
} from "@/src/types/booking.types";
import { AmenityResponse } from "@/src/types/amenity.types";
import { TowerResponse } from "@/src/types/tower.types";
import { extractPaginatedList } from "@/src/utils/listPagination";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Keyboard,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

interface FormValues {
  amenityId: string;
  towerId: string;
  residentId: string;
  description: string;
  status: BookingStatus;
  startDate: string;
  endDate: string;
}

export default function AddEditBooking() {
  const params = useLocalSearchParams<{
    bookingId?: string;
    startDate?: string;
    endDate?: string;
  }>();
  const bookingId = params.bookingId;
  const id = bookingId ? Number(bookingId) : undefined;
  const editMode = !!bookingId;

  const { buildingId } = useAuth();
  const queryClient = useQueryClient();

  const { data: amenityData } = useGetAmenities();
  const { data: towerData } = useGetTowers();
  const { items: amenityList } = extractPaginatedList<AmenityResponse>(amenityData);
  const { items: towerList } = extractPaginatedList<TowerResponse>(towerData);
  const { residences } = useResidencesForActiveBuilding();

  const { data, isLoading } = useGetBookingById(id, editMode);
  const { mutate: addBooking, isPending: isAdding } = useAddBooking();
  const { mutate: updateBooking, isPending: isUpdating } =
    useUpdateBooking(id);

  const [isPaid, setIsPaid] = useState(false);
  const [paidFee, setPaidFee] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [damageDeposit, setDamageDeposit] = useState("");
  const [depositReceiptNumber, setDepositReceiptNumber] = useState("");
  const [paidType, setPaidType] = useState<PaidType>("NONE");
  const [damageDepositPaidType, setDamageDepositPaidType] =
    useState<PaidType>("NONE");
  const [preInspection, setPreInspection] = useState("");
  const [postInspection, setPostInspection] = useState("");
  const [revenueDescription, setRevenueDescription] = useState("");

  const amenities = useMemo(
    () =>
      amenityList.map((a) => ({
        label: a.name,
        value: String(a.id),
      })),
    [amenityList],
  );
  const towers = useMemo(
    () =>
      towerList.map((t) => ({
        label: t.name,
        value: String(t.id),
      })),
    [towerList],
  );

  const presetStart = typeof params.startDate === "string" ? params.startDate : "";
  const presetEnd = typeof params.endDate === "string" ? params.endDate : "";

  const { control, handleSubmit, watch, reset } = useForm<FormValues>({
    defaultValues: {
      amenityId: "",
      towerId: "",
      residentId: "",
      description: "",
      status: "PENDING",
      startDate: presetStart,
      endDate: presetEnd,
    },
  });

  const isElevator = useMemo(() => {
    const amenityId = watch("amenityId");
    const amenity = amenityList.find(
      (a) => String(a.id) === amenityId,
    );
    return amenity?.name?.toLowerCase() === "elevator";
  }, [amenityList, watch("amenityId")]);

  useEffect(() => {
    if (editMode && data?.data) {
      const booking = data.data;

      reset({
        amenityId: String(booking.amenityId ?? ""),
        towerId: String(booking.towerId ?? ""),
        residentId: String(booking.residentId ?? ""),
        description: booking.description ?? "",
        status: normalizeBookingStatus(booking.status),
        startDate: booking.startDate ?? "",
        endDate: booking.endDate ?? "",
      });

      if (booking.revenue) {
        setIsPaid(!!booking.revenue.isPaid);
        setPaidFee(booking.revenue.paidFee ?? "");
        setReceiptNumber(booking.revenue.receiptNumber ?? "");
        setDamageDeposit(booking.revenue.damageDeposit ?? "");
        setDepositReceiptNumber(booking.revenue.depositReceiptNumber ?? "");
        setPaidType(booking.revenue.paidType ?? "NONE");
        setDamageDepositPaidType(
          booking.revenue.damageDepositPaidType ?? "NONE",
        );
        setPreInspection(booking.revenue.preInspection ?? "");
        setPostInspection(booking.revenue.postInspection ?? "");
        setRevenueDescription(booking.revenue.description ?? "");
      }
      return;
    }

    // Create from calendar: prefill selected day slot
    if (!editMode && (presetStart || presetEnd)) {
      reset((prev) => ({
        ...prev,
        startDate: presetStart || prev.startDate,
        endDate: presetEnd || prev.endDate,
      }));
    }
  }, [editMode, data, reset, presetStart, presetEnd]);

  const refreshBookingQueries = async () => {
    await queryClient.invalidateQueries({
      predicate: (query) => String(query.queryKey[0]).includes("/booking"),
    });
    await queryClient.refetchQueries({
      predicate: (query) => String(query.queryKey[0]).includes("/booking"),
    });
  };

  const onSubmit = (values: FormValues) => {
    if (!buildingId || !values.amenityId) return;

    const amenity = amenityList.find(
      (a) => String(a.id) === values.amenityId,
    );

    const payload: any = {
      title: amenity?.name ?? "Booking",
      amenityId: Number(values.amenityId),
      description: values.description,
      buildingId,
      startDate: values.startDate,
      endDate: values.endDate,
      status: normalizeBookingStatus(values.status),
    };

    if (values.towerId) payload.towerId = Number(values.towerId);
    if (values.residentId) payload.residentId = Number(values.residentId);

    payload.revenue = isPaid
      ? {
          isPaid: true,
          paidFee: paidFee || undefined,
          receiptNumber: receiptNumber || undefined,
          damageDeposit: damageDeposit || undefined,
          depositReceiptNumber: depositReceiptNumber || undefined,
          paidType,
          damageDepositPaidType,
          preInspection: preInspection || undefined,
          postInspection: postInspection || undefined,
          description: revenueDescription || undefined,
        }
      : {
          isPaid: false,
          paidType: "NONE",
          damageDepositPaidType: "NONE",
        };

    const onSuccess = async () => {
      await refreshBookingQueries();
      router.back();
    };

    if (editMode) {
      updateBooking(payload, { onSuccess });
    } else {
      addBooking(payload, { onSuccess });
    }
  };

  if (editMode && isLoading) {
    return <LoadingState message="Booking details loading." />;
  }

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon={editMode ? "create" : "add-circle"}
        title={editMode ? "Edit Booking" : "Add Booking"}
        subtitle={
          editMode ? "Update booking details" : "Create a new booking"
        }
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 10,
            paddingBottom: 30,
          }}
          enableOnAndroid
          extraScrollHeight={20}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Controller
            control={control}
            name="amenityId"
            render={({ field: { onChange, value } }) => (
              <SelectField
                label="Amenity"
                value={value}
                onChange={onChange}
                options={amenities}
                placeholder="Select Amenity"
                mode="dropdown"
              />
            )}
          />

          {isElevator && (
            <View className="mt-3">
              <Controller
                control={control}
                name="towerId"
                render={({ field: { onChange, value } }) => (
                  <SelectField
                    label="Tower"
                    value={value}
                    onChange={onChange}
                    options={towers}
                    placeholder="Select Tower"
                    mode="dropdown"
                  />
                )}
              />
            </View>
          )}

          <View className="mt-3">
            <Controller
              control={control}
              name="residentId"
              render={({ field: { onChange, value } }) => (
                <SelectField
                  label="Resident"
                  value={value}
                  onChange={onChange}
                  options={residences}
                  placeholder="Select Resident"
                />
              )}
            />
          </View>

          <View className="mt-3">
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <TextAreaField
                  label="Description"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Short description of the booking"
                />
              )}
            />
          </View>

          <View className="mt-3">
            <Controller
              control={control}
              name="status"
              render={({ field: { onChange, value } }) => (
                <SelectField
                  label="Status"
                  value={value}
                  onChange={(v) => onChange(v as BookingStatus)}
                  options={BOOKING_STATUS_OPTIONS}
                  placeholder="Select Status"
                  mode="dropdown"
                />
              )}
            />
          </View>

          <View className="mt-3">
            <Text className="mb-2 text-base font-semibold text-slate-700">
              Start Date & Time
            </Text>
            <Controller
              control={control}
              name="startDate"
              render={({ field: { onChange, value } }) => (
                <DatePickerField value={value} onChange={onChange} showTime />
              )}
            />
          </View>

          <View className="mt-3">
            <Text className="mb-2 text-base font-semibold text-slate-700">
              End Date & Time
            </Text>
            <Controller
              control={control}
              name="endDate"
              render={({ field: { onChange, value } }) => (
                <DatePickerField value={value} onChange={onChange} showTime />
              )}
            />
          </View>

          <View className="mt-5 pt-4 border-t border-slate-200">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-slate-700">
                Revenue
              </Text>
              <AppButton
                variant={isPaid ? "outline" : "primary"}
                size="sm"
                fullWidth={false}
                onPress={() => setIsPaid((prev) => !prev)}
              >
                {isPaid ? "Mark Unpaid" : "Mark Paid"}
              </AppButton>
            </View>

            {isPaid && (
              <View className="mt-3 gap-3">
                {/* Non-refundable fee */}
                <View className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 gap-3 border-l-4 border-l-amber-500">
                  <Text className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
                    Non-refundable fee
                  </Text>
                  <AppInput
                    label="Fee Amount"
                    value={paidFee}
                    onChangeText={setPaidFee}
                    placeholder="Fee amount"
                    keyboardType="decimal-pad"
                  />
                  <AppInput
                    label="Receipt Number"
                    value={receiptNumber}
                    onChangeText={setReceiptNumber}
                    placeholder="Receipt #"
                  />
                  <SelectField
                    label="Payment Type"
                    value={paidType}
                    onChange={(v) => setPaidType(v as PaidType)}
                    options={PAID_TYPE_OPTIONS}
                    placeholder="Select Payment Type"
                    mode="dropdown"
                  />
                </View>

                {/* Refundable deposit */}
                <View className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 gap-3 border-l-4 border-l-emerald-500">
                  <Text className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                    Refundable — deposit
                  </Text>
                  <AppInput
                    label="Deposit Amount"
                    value={damageDeposit}
                    onChangeText={setDamageDeposit}
                    placeholder="Deposit amount"
                    keyboardType="decimal-pad"
                  />
                  <AppInput
                    label="Deposit Receipt Number"
                    value={depositReceiptNumber}
                    onChangeText={setDepositReceiptNumber}
                    placeholder="Receipt # for deposit"
                  />
                  <SelectField
                    label="Deposit Payment Type"
                    value={damageDepositPaidType}
                    onChange={(v) => setDamageDepositPaidType(v as PaidType)}
                    options={PAID_TYPE_OPTIONS}
                    placeholder="Select Deposit Payment Type"
                    mode="dropdown"
                  />
                </View>

                {/* Inspections & notes */}
                <View className="rounded-xl border border-slate-200 bg-slate-50 p-3 gap-3">
                  <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    Inspections & notes
                  </Text>
                  <TextAreaField
                    label="Pre-inspection"
                    value={preInspection}
                    onChangeText={setPreInspection}
                    placeholder="Pre-inspection notes"
                  />
                  <TextAreaField
                    label="Post-inspection"
                    value={postInspection}
                    onChangeText={setPostInspection}
                    placeholder="Post-inspection notes"
                  />
                  <TextAreaField
                    label="Revenue Notes"
                    value={revenueDescription}
                    onChangeText={setRevenueDescription}
                    placeholder="Additional notes"
                  />
                </View>
              </View>
            )}
          </View>

          <View className="mt-6">
            <AppButton
              loading={editMode ? isUpdating : isAdding}
              onPress={handleSubmit(onSubmit)}
            >
              {editMode ? "Update Booking" : "Create Booking"}
            </AppButton>
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}
