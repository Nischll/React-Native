import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface StatusTab {
  label: string;
  value: string;
  count?: number;
}

interface TaskStatusTabsProps {
  tabs: StatusTab[];
  selectedValue: string;
  onSelect: (value: string) => void;
  taskCounts?: Record<string, number>;
}

export default function TaskStatusTabs({
  tabs,
  selectedValue,
  onSelect,
  taskCounts = {},
}: TaskStatusTabsProps) {
  return (
    <View className="border-b border-gray-200 bg-white">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName=""
      >
        {tabs.map((tab) => {
          const isSelected = selectedValue === tab.value;
          const count = taskCounts[tab.value] ?? 0;

          return (
            <TouchableOpacity
              key={tab.value}
              onPress={() => onSelect(tab.value)}
              activeOpacity={0.7}
              className={`mr-5 py-3 border-b-2 ${
                isSelected ? "border-primary" : "border-transparent"
              }`}
            >
              <View className="flex-row items-center gap-1.5">
                <Text
                  className={`text-sm font-medium ${
                    isSelected ? "text-primary" : "text-gray-500"
                  }`}
                >
                  {tab.label}
                </Text>
                <View
                  className={`rounded-full px-1.5 py-0.5 min-w-5 items-center ${
                    isSelected ? "bg-primary" : "bg-gray-200"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isSelected ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {count}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
