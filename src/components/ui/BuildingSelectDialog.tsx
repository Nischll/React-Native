import { BuildingItem } from "@/src/types/auth.types";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SELECT_CONFIRM_MS = 480;

interface Props {
  open: boolean;
  buildings: BuildingItem[];
  selectedBuilding: BuildingItem | null;
  onSelect: (building: BuildingItem) => void;
  onClose: () => void;
}

export const BuildingSelectDialog: React.FC<Props> = ({
  open,
  buildings,
  selectedBuilding,
  onSelect,
  onClose,
}) => {
  const [pendingBuilding, setPendingBuilding] = useState<BuildingItem | null>(
    null,
  );

  useEffect(() => {
    if (!open) {
      setPendingBuilding(null);
    }
  }, [open]);

  const handlePickBuilding = (building: BuildingItem) => {
    if (pendingBuilding) return;

    setPendingBuilding(building);

    setTimeout(() => {
      setPendingBuilding(null);
      onSelect(building);
    }, SELECT_CONFIRM_MS);
  };

  const otherBuildings = selectedBuilding
    ? buildings.filter((b) => b.value !== selectedBuilding.value)
    : buildings;

  return (
    <Modal visible={open} transparent animationType="fade" statusBarTranslucent>
      <View
        className="flex-1 items-center justify-center bg-black/40"
        style={{
          paddingTop: Platform.OS === "android" ? 0 : 0,
        }}
      >
        <View className="relative max-h-3/4 w-11/12 rounded-xl bg-white p-5">
          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            className="absolute right-3 top-3 z-10 p-1"
          >
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>

          {/* Header */}
          <Text className="mb-1 text-xl font-bold text-gray-900">
            {selectedBuilding ? "Switch Building" : "Select Building"}
          </Text>

          <Text className="mb-4 text-sm text-gray-500">
            {selectedBuilding
              ? "Choose the building you want to work with."
              : "Select a building to start using the app."}
          </Text>

          {/* Loading State */}
          {pendingBuilding && (
            <View className="mb-3 flex-row items-center">
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text className="ml-2 text-blue-600">
                Switching to {pendingBuilding.label}…
              </Text>
            </View>
          )}

          {/* Current Building */}
          {selectedBuilding && (
            <View className="mb-4 rounded-lg border-2 border-blue-400 bg-blue-50 p-3">
              <Text className="text-xs text-gray-500">Current building</Text>
              <Text className="text-base font-semibold text-gray-900">
                {selectedBuilding.label}
              </Text>
            </View>
          )}

          {/* Building List */}
          <FlatList
            data={otherBuildings}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handlePickBuilding(item)}
                disabled={!!pendingBuilding}
                className="border-b border-gray-200 px-2 py-3"
              >
                <Text className="text-gray-900">{item.label}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text className="mt-2 text-center text-gray-500">
                No other buildings available.
              </Text>
            }
          />
        </View>
      </View>
    </Modal>
  );
};
