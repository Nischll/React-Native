import SelectField from "@/src/components/ui/SelectField";
import { useGetAmenities } from "@/src/api/amenity.api";
import { useGetTowers } from "@/src/api/tower.api";
import { useResidencesForActiveBuilding } from "@/src/hooks/useResidenceByBuilding";
import { AmenityResponse } from "@/src/types/amenity.types";
import { TowerResponse } from "@/src/types/tower.types";
import { extractPaginatedList } from "@/src/utils/listPagination";
import { Modal, Pressable, Text, View } from "react-native";

interface BookingFilterModalProps {
  visible: boolean;
  onClose: () => void;

  amenityId?: number;
  setAmenityId: (value?: number) => void;

  towerId?: number;
  setTowerId: (value?: number) => void;

  residentId?: number;
  setResidentId: (value?: number) => void;
}

export const BookingFilterModal = ({
  visible,
  onClose,
  amenityId,
  setAmenityId,
  towerId,
  setTowerId,
  residentId,
  setResidentId,
}: BookingFilterModalProps) => {
  const { data: amenityData } = useGetAmenities(visible);
  const { data: towerData } = useGetTowers(visible);
  const { residences } = useResidencesForActiveBuilding();

  const amenities = extractPaginatedList<AmenityResponse>(amenityData).items.map((a) => ({
    label: a.name,
    value: String(a.id),
  }));
  const towers = extractPaginatedList<TowerResponse>(towerData).items.map((t) => ({
    label: t.name,
    value: String(t.id),
  }));

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <Pressable
          className="bg-white rounded-t-3xl p-5"
          style={{ minHeight: 380, maxHeight: "80%" }}
          onPress={(e) => e.stopPropagation()}
        >
          <Text className="text-lg font-bold mb-4">Filter Bookings</Text>

          <SelectField
            label="Amenity"
            value={amenityId?.toString()}
            onChange={(v) => setAmenityId(v ? Number(v) : undefined)}
            options={amenities}
            placeholder="All Amenities"
            mode="dropdown"
          />

          <View className="mt-3">
            <SelectField
              label="Tower"
              value={towerId?.toString()}
              onChange={(v) => setTowerId(v ? Number(v) : undefined)}
              options={towers}
              placeholder="All Towers"
              mode="dropdown"
            />
          </View>

          <View className="mt-3">
            <SelectField
              label="Unit"
              value={residentId?.toString()}
              onChange={(v) => setResidentId(v ? Number(v) : undefined)}
              options={[
                { label: "All units", value: "" },
                ...residences,
              ]}
              placeholder="All units"
            />
          </View>

          <View className="flex-row gap-3 mt-6">
            <Pressable
              className="flex-1 border border-gray-300 rounded-xl py-3"
              onPress={() => {
                setAmenityId(undefined);
                setTowerId(undefined);
                setResidentId(undefined);
              }}
            >
              <Text className="text-center">Reset</Text>
            </Pressable>

            <Pressable
              className="flex-1 bg-primary rounded-xl py-3"
              onPress={onClose}
            >
              <Text className="text-center text-white">Apply</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
