import { useCreateCommunicationWithRefresh } from "@/src/api/communication.api";
import AppIcon from "@/src/components/ui/AppIcon";
import { useAuth } from "@/src/providers/AuthProvider";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Audience = "everyone" | "buildings";

export function NoticeComposer() {
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [audience, setAudience] = useState<Audience>("buildings");
  const { user, selectedBuilding } = useAuth();
  const { mutate: create, isPending } = useCreateCommunicationWithRefresh();

  const buildingOptions = user?.buildingList ?? [];
  const defaultBuildingId = selectedBuilding
    ? Number(selectedBuilding.value)
    : buildingOptions[0]
      ? Number(buildingOptions[0].value)
      : null;

  const [buildingIds, setBuildingIds] = useState<number[]>(() =>
    defaultBuildingId ? [defaultBuildingId] : [],
  );

  const selectedLabels = useMemo(() => {
    return buildingOptions
      .filter((b) => buildingIds.includes(Number(b.value)))
      .map((b) => b.label.split("(")[0]?.trim() || b.label);
  }, [buildingOptions, buildingIds]);

  const canSend =
    text.trim().length > 0 &&
    (audience === "everyone" || buildingIds.length > 0);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (audience === "buildings" && buildingIds.length === 0) return;

    create(
      audience === "everyone"
        ? { message: trimmed }
        : { message: trimmed, buildingIds },
      {
        onSuccess: () => {
          setText("");
          setExpanded(false);
          setAudience("buildings");
          setBuildingIds(defaultBuildingId ? [defaultBuildingId] : []);
        },
      },
    );
  };

  const handleCancel = () => {
    setText("");
    setExpanded(false);
    setAudience("buildings");
    setBuildingIds(defaultBuildingId ? [defaultBuildingId] : []);
  };

  const toggleBuilding = (id: number) => {
    setBuildingIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
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

        {(expanded || text.trim().length > 0) && (
          <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
              <TouchableOpacity
                onPress={() => setAudience("everyone")}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 99,
                  borderWidth: 1.5,
                  borderColor: audience === "everyone" ? "#7C3AED" : "#E2E8F0",
                  backgroundColor:
                    audience === "everyone" ? "#F5F3FF" : "#FAFAFA",
                }}
              >
                <AppIcon
                  name="globe-outline"
                  size={14}
                  color={audience === "everyone" ? "#7C3AED" : "#64748B"}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: audience === "everyone" ? "#7C3AED" : "#64748B",
                  }}
                >
                  Everyone
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAudience("buildings")}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 99,
                  borderWidth: 1.5,
                  borderColor: audience === "buildings" ? "#7C3AED" : "#E2E8F0",
                  backgroundColor:
                    audience === "buildings" ? "#F5F3FF" : "#FAFAFA",
                }}
              >
                <AppIcon
                  name="business-outline"
                  size={14}
                  color={audience === "buildings" ? "#7C3AED" : "#64748B"}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: audience === "buildings" ? "#7C3AED" : "#64748B",
                  }}
                >
                  Selected buildings
                </Text>
              </TouchableOpacity>
            </View>

            {audience === "buildings" ? (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 6,
                  marginBottom: 10,
                }}
              >
                {buildingOptions.map((b) => {
                  const id = Number(b.value);
                  const on = buildingIds.includes(id);
                  return (
                    <TouchableOpacity
                      key={b.value}
                      onPress={() => toggleBuilding(id)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 99,
                        borderWidth: 1,
                        borderColor: on ? "#16A34A" : "#E2E8F0",
                        backgroundColor: on ? "#F0FDF4" : "#fff",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "600",
                          color: on ? "#16A34A" : "#64748B",
                        }}
                      >
                        {b.label.split("(")[0]?.trim() || b.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}

            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={
                audience === "everyone"
                  ? "Broadcast a notice to everyone…"
                  : "Share an update for the selected buildings…"
              }
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

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginBottom: 8,
              }}
            >
              <AppIcon
                name={audience === "everyone" ? "globe-outline" : "business-outline"}
                size={12}
                color="#94A3B8"
              />
              <Text style={{ fontSize: 11, color: "#94A3B8" }}>
                {audience === "everyone"
                  ? "Sending to everyone"
                  : selectedLabels.length
                    ? `Sending to ${selectedLabels.join(", ")}`
                    : "Pick at least one building"}
              </Text>
            </View>

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
                onPress={handleCancel}
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
                disabled={!canSend || isPending}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 16,
                  paddingVertical: 7,
                  borderRadius: 10,
                  backgroundColor: !canSend || isPending ? "#E2E8F0" : "#7C3AED",
                }}
              >
                {isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <AppIcon
                    name="send"
                    size={14}
                    color={!canSend ? "#94A3B8" : "#fff"}
                  />
                )}
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: !canSend || isPending ? "#94A3B8" : "#fff",
                  }}
                >
                  {isPending ? "Posting…" : "Post"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {!expanded && text.trim().length === 0 && (
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
