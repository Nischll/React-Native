import { useCreateCommunicationWithRefresh } from "@/src/api/communication.api";
import AppIcon from "@/src/components/ui/AppIcon";
import SelectField from "@/src/components/ui/SelectField";
import {
  MentionState,
  MentionSuggestions,
  MentionTextInput,
} from "@/src/helper/mentionTextInput";
import { useEmployeeOptions } from "@/src/hooks/useEmployee";
import { useResidencesForActiveBuilding } from "@/src/hooks/useResidenceByBuilding";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

export function NoticeComposer() {
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [mentionState, setMentionState] = useState<MentionState | null>(null);
  const [selectedBuildingUnit, setSelectedBuildingUnit] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const { residences, isLoading: loadingResidences } =
    useResidencesForActiveBuilding();
  const { employees, isLoading: loadingEmployees } = useEmployeeOptions();

  const { mutate: create, isPending } = useCreateCommunicationWithRefresh();

  const hasText = text.trim().length > 0;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    create(
      {
        message: trimmed,
        parentId: null,
        buildingId: selectedBuildingUnit ? Number(selectedBuildingUnit) : null,
        employeeId: selectedEmployee ? Number(selectedEmployee) : null,
      },
      {
        onSuccess: () => {
          setText("");
          setExpanded(false);
          setMentionState(null);
          setSelectedBuildingUnit("");
          setSelectedEmployee("");
        },
      },
    );
  };

  return (
    <View style={{ marginHorizontal: 6, marginBottom: 12 }}>
      <View
        style={{
          borderRadius: 16,
          borderWidth: expanded ? 1.5 : 1,
          borderColor: expanded ? "#7C3AED" : "#E2E8F0",
          backgroundColor: "#fff",
          shadowColor: "#64748B",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {/* Header */}
        <Pressable
          onPress={() => setExpanded(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 14,
            paddingTop: 14,
            paddingBottom: expanded ? 6 : 14,
          }}
        >
          <AppIcon name="megaphone-outline" size={16} color="#7C3AED" />
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: "#7C3AED",
              letterSpacing: 0.3,
            }}
          >
            POST A MESSAGE
          </Text>
        </Pressable>

        {/* Expanded area */}
        {(expanded || hasText) && (
          <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
            {/* Message input */}
            <MentionTextInput
              value={text}
              onChangeText={setText}
              onMentionStateChange={setMentionState}
              placeholder="Share an update with the team…"
              placeholderTextColor="#CBD5E1"
              multiline
              autoFocus={expanded}
              style={{
                fontSize: 14,
                color: "#1E293B",
                minHeight: 72,
                maxHeight: 160,
                lineHeight: 22,
                marginBottom: 10,
              }}
            />

            {mentionState && (
              <MentionSuggestions
                mentionState={mentionState}
                value={text}
                onChangeText={setText}
                onDismiss={() => setMentionState(null)}
                direction="below"
              />
            )}

            {/* Optional tag row */}
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                marginBottom: 10,
              }}
            >
              {/* Building / Unit selector */}
              <View style={{ flex: 1 }}>
                <SelectField
                  label=""
                  value={selectedBuildingUnit}
                  onChange={setSelectedBuildingUnit}
                  options={residences}
                  placeholder="Tag a unit (optional)"
                  // isLoading={loadingResidences}
                />
              </View>

              {/* Employee selector */}
              {/* <View style={{ flex: 1 }}>
                <SelectField
                  label=""
                  value={selectedEmployee}
                  onChange={setSelectedEmployee}
                  options={employees}
                  placeholder="Tag staff (optional)"
                  // isLoading={loadingEmployees}
                />
              </View> */}
            </View>

            {/* Selected tags preview */}
            {(selectedBuildingUnit || selectedEmployee) && (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 6,
                  marginBottom: 10,
                }}
              >
                {selectedBuildingUnit && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      backgroundColor: "#EDE9FE",
                      borderRadius: 99,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                    }}
                  >
                    <AppIcon name="home-outline" size={11} color="#7C3AED" />
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#7C3AED",
                        fontWeight: "600",
                      }}
                    >
                      {residences.find((r) => r.value === selectedBuildingUnit)
                        ?.label ?? selectedBuildingUnit}
                    </Text>
                    <Pressable
                      onPress={() => setSelectedBuildingUnit("")}
                      hitSlop={6}
                    >
                      <AppIcon name="close-circle" size={13} color="#7C3AED" />
                    </Pressable>
                  </View>
                )}
                {selectedEmployee && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      backgroundColor: "#EDE9FE",
                      borderRadius: 99,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                    }}
                  >
                    <AppIcon name="person-outline" size={11} color="#7C3AED" />
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#7C3AED",
                        fontWeight: "600",
                      }}
                    >
                      {employees.find((e) => e.value === selectedEmployee)
                        ?.label ?? selectedEmployee}
                    </Text>
                    <Pressable
                      onPress={() => setSelectedEmployee("")}
                      hitSlop={6}
                    >
                      <AppIcon name="close-circle" size={13} color="#7C3AED" />
                    </Pressable>
                  </View>
                )}
              </View>
            )}

            {/* Actions */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 8,
                paddingTop: 4,
              }}
            >
              <Pressable
                onPress={() => {
                  setText("");
                  setExpanded(false);
                  setMentionState(null);
                  setSelectedBuildingUnit("");
                  setSelectedEmployee("");
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 10,
                  backgroundColor: "#F1F5F9",
                }}
              >
                <Text
                  style={{ fontSize: 13, fontWeight: "600", color: "#64748B" }}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSend}
                disabled={!text.trim() || isPending}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 16,
                  paddingVertical: 7,
                  borderRadius: 10,
                  backgroundColor:
                    !text.trim() || isPending ? "#E2E8F0" : "#7C3AED",
                }}
              >
                {isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <AppIcon
                    name="send"
                    size={14}
                    color={!text.trim() ? "#94A3B8" : "#fff"}
                  />
                )}
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: !text.trim() || isPending ? "#94A3B8" : "#fff",
                  }}
                >
                  {isPending ? "Posting…" : "Post"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Collapsed placeholder */}
        {!expanded && !hasText && (
          <Pressable
            onPress={() => setExpanded(true)}
            style={{ paddingHorizontal: 14, paddingBottom: 14 }}
          >
            <Text style={{ fontSize: 14, color: "#CBD5E1" }}>
              Share an update with the team…
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
