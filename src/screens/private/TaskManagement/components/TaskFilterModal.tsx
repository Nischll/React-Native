import DatePickerField from "@/src/components/ui/DatePickerField";
import AppInput from "@/src/components/ui/AppInput";
import SelectField from "@/src/components/ui/SelectField";
import { useResidencesForActiveBuilding } from "@/src/hooks/useResidenceByBuilding";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";

interface TaskFilterModalProps {
  visible: boolean;
  onClose: () => void;

  residentId?: number;
  setResidentId?: (value?: number) => void;

  trackingId?: string;
  setTrackingId?: (value: string) => void;

  dateType: "today" | "week" | "month" | "custom";
  fromDate?: string;
  toDate?: string;

  setFromDate: (value?: string) => void;
  setToDate: (value?: string) => void;

  applyPreset: (type: "today" | "week" | "month" | "custom") => void;
  showDateRange?: boolean;
  showResident?: boolean;
  /** Label for the unit select. Default "Unit". */
  residentLabel?: string;
}

export const TaskFilterModal = ({
  visible,
  onClose,
  residentId,
  setResidentId,
  trackingId,
  setTrackingId,
  dateType,
  fromDate,
  toDate,
  setFromDate,
  setToDate,
  applyPreset,
  showDateRange = true,
  showResident = true,
  residentLabel = "Unit",
}: TaskFilterModalProps) => {
  const { residences } = useResidencesForActiveBuilding();

  const handleFromDateChange = (value: string) => {
    setFromDate(value.split("T")[0]);
  };

  const handleToDateChange = (value: string) => {
    setToDate(value.split("T")[0]);
  };
  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        statusBarTranslucent
      >
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
          <Pressable
            className="bg-white rounded-t-3xl p-5"
            style={{
              minHeight: showDateRange ? 420 : 280,
              maxHeight: "80%",
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-lg font-bold mb-4">Filters</Text>
            {showResident && (
              <SelectField
                label={residentLabel}
                value={residentId?.toString()}
                onChange={(v) =>
                  setResidentId?.(v ? Number(v) : undefined)
                }
                options={[
                  { label: "All units", value: "" },
                  ...residences,
                ]}
                placeholder="All units"
              />
            )}

            {!!setTrackingId && (
              <>
                <View style={{ height: 12 }} />
                <AppInput
                  label="Tracking ID"
                  value={trackingId ?? ""}
                  onChangeText={(t) => setTrackingId?.(t)}
                  placeholder="Search tracking ID"
                />
              </>
            )}

            {showDateRange && (
              <>
                <Text className="text-sm font-medium text-gray-700 mt-4 mb-2">
                  Date Range
                </Text>

                <View className="flex-row flex-wrap gap-2 mb-4">
                  {[
                    { key: "today", label: "Today" },
                    { key: "week", label: "This Week" },
                    { key: "month", label: "This Month" },
                    { key: "custom", label: "Custom" },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      onPress={() => applyPreset(item.key as any)}
                      className={`px-4 py-2 rounded-full ${
                        dateType === item.key ? "bg-primary" : "bg-gray-100"
                      }`}
                    >
                      <Text
                        className={
                          dateType === item.key ? "text-white" : "text-gray-600"
                        }
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {dateType === "custom" && (
                  <>
                    <DatePickerField
                      value={fromDate}
                      onChange={handleFromDateChange}
                      placeholder="From Date"
                    />

                    <View className="h-3" />

                    <DatePickerField
                      value={toDate}
                      onChange={handleToDateChange}
                      placeholder="To Date"
                    />
                  </>
                )}
              </>
            )}

            <View className="flex-row gap-3 mt-5">
              <TouchableOpacity
                className="flex-1 border border-gray-300 rounded-xl py-3"
                onPress={() => {
                  setResidentId?.(undefined);
                  setTrackingId?.("");
                  if (showDateRange) applyPreset("month");
                }}
              >
                <Text className="text-center">Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-primary rounded-xl py-3"
                onPress={onClose}
              >
                <Text className="text-center text-white">Apply</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};
