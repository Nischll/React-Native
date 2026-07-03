import AppIcon from "@/src/components/ui/AppIcon";
import AppInput from "@/src/components/ui/AppInput";
import {
  ResidenceOption,
  useResidencesForActiveBuilding,
} from "@/src/hooks/useResidenceByBuilding";
import { Portal } from "@gorhom/portal";

import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TouchableHighlight,
  View,
} from "react-native";

interface ResidentSearchBarProps {
  onSelectResident?: (residentId: string, residence: ResidenceOption) => void;
  placeholder?: string;
}

const ICON_COLUMN_WIDTH = 40;

interface DropdownLayout {
  top: number;
  left: number;
  width: number;
}

export default function SearchBar({
  onSelectResident,
  placeholder = "Search by unit or resident name...",
}: ResidentSearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState<DropdownLayout | null>(
    null,
  );
  const containerRef = useRef<View>(null);

  const { residences, isLoading } = useResidencesForActiveBuilding();

  const trimmedQuery = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!trimmedQuery) return residences;
    return residences.filter((item) =>
      item.label.toLowerCase().includes(trimmedQuery),
    );
  }, [residences, trimmedQuery]);

  const measureAndOpen = () => {
    containerRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownLayout({ top: y + height + 6, left: x, width });
      setIsFocused(true);
    });
  };

  const closeDropdown = () => setIsFocused(false);

  const handleSelect = (item: ResidenceOption) => {
    setQuery("");
    closeDropdown();
    if (onSelectResident) {
      onSelectResident(item.value, item);
    } else {
      router.push({
        pathname: "/(private)/resident-management",
        params: { residentId: String(item.value) },
      });
    }
  };

  const renderHighlightedLabel = (label: string) => {
    if (!trimmedQuery) {
      return (
        <Text className="text-sm font-semibold text-textPrimary">{label}</Text>
      );
    }

    const matchIndex = label.toLowerCase().indexOf(trimmedQuery);
    if (matchIndex === -1) {
      return (
        <Text className="text-sm font-semibold text-textPrimary">{label}</Text>
      );
    }

    const before = label.slice(0, matchIndex);
    const match = label.slice(matchIndex, matchIndex + trimmedQuery.length);
    const after = label.slice(matchIndex + trimmedQuery.length);

    return (
      <Text className="text-sm font-semibold text-textPrimary">
        {before}
        <Text className="text-primary">{match}</Text>
        {after}
      </Text>
    );
  };

  return (
    <View ref={containerRef} collapsable={false}>
      <AppInput
        placeholder={placeholder}
        leftIcon="search"
        size="sm"
        value={query}
        onChangeText={setQuery}
        onFocus={measureAndOpen}
      />

      {isFocused && dropdownLayout && (
        <Portal hostName="dropdown-host">
          <Pressable
            style={{
              position: "absolute",
              top: 25,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            onPress={closeDropdown}
          >
            <View
              style={{
                position: "absolute",
                top: dropdownLayout.top,
                left: dropdownLayout.left,
                width: dropdownLayout.width,
              }}
            >
              <Pressable onPress={() => {}}>
                <View
                  className="bg-white rounded-2xl overflow-hidden"
                  style={{
                    maxHeight: 320,
                    shadowColor: "#000",
                    shadowOpacity: 0.12,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 6,
                  }}
                >
                  {isLoading ? (
                    <View className="items-center justify-center py-6">
                      <ActivityIndicator color="#453956" />
                    </View>
                  ) : filtered.length === 0 ? (
                    <View className="items-center justify-center py-6 px-4">
                      <AppIcon
                        name="search-outline"
                        size={22}
                        color="#B4B2A9"
                      />
                      <Text className="mt-2 text-xs font-medium text-textSecondary text-center">
                        {trimmedQuery
                          ? `No residents matching "${query.trim()}"`
                          : "No residents found for this building"}
                      </Text>
                    </View>
                  ) : (
                    <ScrollView
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator={false}
                    >
                      {!trimmedQuery && (
                        <Text className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-textSecondary/70">
                          All residents
                        </Text>
                      )}
                      {filtered.map((item, index) => (
                        <TouchableHighlight
                          key={item.value}
                          underlayColor="#F1EFE8"
                          onPress={() => handleSelect(item)}
                          style={
                            index !== filtered.length - 1
                              ? {
                                  borderBottomWidth: 1,
                                  borderBottomColor: "#F3F4F6",
                                }
                              : undefined
                          }
                        >
                          <View className="flex-row items-stretch gap-3 px-4 py-6">
                            <View
                              className="items-center justify-center rounded-2xl bg-primary/10"
                              style={{
                                width: ICON_COLUMN_WIDTH,
                                minHeight: ICON_COLUMN_WIDTH,
                              }}
                            >
                              <AppIcon
                                name="person-outline"
                                size={16}
                                color="#453956"
                              />
                            </View>

                            <View className="flex-1 justify-center">
                              {renderHighlightedLabel(item.label)}
                            </View>

                            <View className="justify-center">
                              <AppIcon
                                name="chevron-forward"
                                size={16}
                                color="#B4B2A9"
                              />
                            </View>
                          </View>
                        </TouchableHighlight>
                      ))}
                    </ScrollView>
                  )}
                </View>
              </Pressable>
            </View>
          </Pressable>
        </Portal>
      )}
    </View>
  );
}
