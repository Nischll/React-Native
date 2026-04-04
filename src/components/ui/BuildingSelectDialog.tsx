import { BuildingItem } from "@/src/types/auth.types";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
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
}

export const BuildingSelectDialog: React.FC<Props> = ({
  open,
  buildings,
  selectedBuilding,
  onSelect,
}) => {
  const [pendingBuilding, setPendingBuilding] = useState<BuildingItem | null>(
    null,
  );

  useEffect(() => {
    if (!open) setPendingBuilding(null);
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
    <Modal visible={open} transparent animationType="fade">
      <View className="flex-1 bg-black/40 justify-center items-center">
        <View className="w-11/12 max-h-3/4 bg-white dark:bg-gray-800 rounded-xl p-5">
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {selectedBuilding ? "Switch Building" : "Select Building"}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-300 mb-4">
            {selectedBuilding
              ? "Choose the building you want to work with."
              : "Select a building to start using the app."}
          </Text>

          {pendingBuilding && (
            <View className="flex-row items-center mb-3">
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text className="ml-2 text-blue-600 dark:text-blue-400">
                Switching to {pendingBuilding.label}…
              </Text>
            </View>
          )}

          {selectedBuilding && (
            <View className="mb-4 p-3 border-2 border-blue-400 rounded-lg bg-blue-50 dark:bg-blue-900">
              <Text className="text-xs text-gray-500 dark:text-gray-300">
                Current building
              </Text>
              <Text className="text-base font-semibold text-gray-900 dark:text-white">
                {selectedBuilding.label}
              </Text>
            </View>
          )}

          <FlatList
            data={otherBuildings}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handlePickBuilding(item)}
                disabled={!!pendingBuilding}
                className="py-3 px-2 border-b border-gray-200 dark:border-gray-700"
              >
                <Text className="text-gray-900 dark:text-white">
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text className="text-center text-gray-500 dark:text-gray-400 mt-2">
                No other buildings available.
              </Text>
            }
          />
        </View>
      </View>
    </Modal>
  );
};
