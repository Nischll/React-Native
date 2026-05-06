import * as DocumentPicker from "expo-document-picker";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import AppIcon from "../components/ui/AppIcon";
import { UserData } from "../types/auth.types";

export function AvatarPicker({
  initials,
  remoteUri,
  localUri,
  saving,
  onPick,
  onSave,
  onCancel,
}: {
  initials: UserData | null;
  remoteUri: string | null;
  localUri: string | null;
  saving?: boolean;
  onPick: (uri: string, fileName: string, mimeType: string) => void;
  onSave?: () => void;
  onCancel?: () => void;
}) {
  const displayUri = localUri || remoteUri;
  const hasPendingImage = !!localUri;

  async function handlePick() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*"],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    onPick(
      asset.uri,
      asset.name ?? `avatar_${Date.now()}.jpg`,
      asset.mimeType ?? "image/jpeg",
    );
  }

  return (
    <View style={{ alignItems: "center", paddingVertical: 24 }}>
      <Pressable
        onPress={hasPendingImage ? undefined : handlePick}
        style={{ position: "relative" }}
      >
        <View
          style={{
            width: 90,
            height: 90,
            borderRadius: 45,
            backgroundColor: "#EEF2FF",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            borderWidth: 3,
            borderColor: hasPendingImage ? "#FCD34D" : "#C7D2FE",
          }}
        >
          {displayUri ? (
            <Image
              source={{ uri: displayUri }}
              style={{ width: 90, height: 90 }}
              resizeMode="cover"
            />
          ) : (
            <Text style={{ fontSize: 28, fontWeight: "700", color: "#4F46E5" }}>
              {initials?.fullName
                ? initials.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                : "U"}
            </Text>
          )}
        </View>

        {!hasPendingImage && (
          <View
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: "#4F46E5",
              borderWidth: 2,
              borderColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon name="camera" size={13} color="#fff" />
          </View>
        )}
      </Pressable>

      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          color: "#111827",
          marginTop: 12,
        }}
      >
        {initials?.fullName || "User"}
      </Text>
      <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
        @{initials?.username || "username"}
      </Text>

      {hasPendingImage && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginTop: 14,
          }}
        >
          <Pressable
            onPress={onCancel}
            disabled={saving}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: "#F3F4F6",
              borderRadius: 99,
              paddingHorizontal: 14,
              paddingVertical: 7,
            }}
          >
            <AppIcon name="close" size={13} color="#6B7280" />
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#374151" }}>
              Cancel
            </Text>
          </Pressable>

          <Pressable
            onPress={onSave}
            disabled={saving}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: "#4F46E5",
              borderRadius: 99,
              paddingHorizontal: 14,
              paddingVertical: 7,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <AppIcon name="checkmark" size={13} color="#fff" />
            )}
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>
              {saving ? "Saving..." : "Save photo"}
            </Text>
          </Pressable>

          <Pressable
            onPress={handlePick}
            disabled={saving}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: "#F3F4F6",
              borderRadius: 99,
              paddingHorizontal: 14,
              paddingVertical: 7,
            }}
          >
            <AppIcon name="swap-horizontal" size={13} color="#6B7280" />
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#374151" }}>
              Change
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
