import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Image, Pressable, Text, TouchableOpacity, View } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
  /** true = picked from device (needs upload), false = already remote */
  isLocal: boolean;
}

export type FilePickerAccept = "images" | "files" | "all";

interface FilePickerProps {
  /** What to accept: images only, documents only, or both */
  accept?: FilePickerAccept;
  /** Displayed above the pick area */
  label?: string;
  /** Short contextual hint shown inside the empty state */
  hint?: string;
  /** Currently picked/loaded file — null means empty */
  value: PickedFile | null;
  /** Called when user picks a new file */
  onChange: (file: PickedFile | null) => void;
  /** Optional accent colour (dot + border when empty). Defaults to indigo. */
  accentColor?: string;
  /** Optional background colour of empty state. Defaults to light indigo tint. */
  accentBg?: string;
  /** Height of the pick area. Default 140. */
  height?: number;
  /** If true, shows a compact inline strip instead of a tall box (for non-image files) */
  compact?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isImage(mimeType: string) {
  return mimeType.startsWith("image/");
}

function truncate(str: string, max = 30) {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FilePicker({
  accept = "images",
  label,
  hint,
  value,
  onChange,
  accentColor = "#4F46E5",
  accentBg = "#EEF2FF",
  height = 140,
  compact = false,
}: FilePickerProps) {
  // ── Pick handler ────────────────────────────────────────────────────────────

  async function handlePick() {
    if (accept === "images") {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "Images" as any,
        quality: 0.85,
        allowsEditing: false,
      });
      if (result.canceled || !result.assets.length) return;
      const asset = result.assets[0];
      onChange({
        uri: asset.uri,
        name: asset.fileName ?? `image_${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? "image/jpeg",
        isLocal: true,
      });
      return;
    }

    // "files" or "all"
    const result = await DocumentPicker.getDocumentAsync({
      type: accept === "files" ? "*/*" : ["image/*", "*/*"],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    onChange({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? "application/octet-stream",
      isLocal: true,
    });
  }

  function handleRemove() {
    onChange(null);
  }

  // ── Compact strip (for non-image file display) ───────────────────────────

  if (compact) {
    return (
      <View>
        {label && (
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: "#374151",
              marginBottom: 6,
            }}
          >
            {label}
          </Text>
        )}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1.5,
            borderColor: value ? "#D1D5DB" : accentColor,
            borderStyle: value ? "solid" : "dashed",
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: value ? "#fff" : accentBg,
            gap: 10,
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: value ? "#F3F4F6" : accentBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {value && isImage(value.mimeType) ? (
              <Image
                source={{ uri: value.uri }}
                style={{ width: 36, height: 36, borderRadius: 8 }}
                resizeMode="cover"
              />
            ) : (
              <Ionicons
                name={value ? "document-text-outline" : "cloud-upload-outline"}
                size={20}
                color={value ? "#6B7280" : accentColor}
              />
            )}
          </View>

          {/* Name / prompt */}
          <View style={{ flex: 1 }}>
            {value ? (
              <>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#111827",
                  }}
                  numberOfLines={1}
                >
                  {truncate(value.name)}
                </Text>
                <Text style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>
                  {value.isLocal ? "Ready to upload" : "Existing file"}
                </Text>
              </>
            ) : (
              <Text
                style={{ fontSize: 13, color: accentColor, fontWeight: "600" }}
              >
                {hint ?? "Tap to choose a file"}
              </Text>
            )}
          </View>

          {/* Action button */}
          {value ? (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity onPress={handlePick}>
                <Ionicons
                  name="swap-horizontal-outline"
                  size={18}
                  color="#6B7280"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRemove}>
                <Ionicons
                  name="close-circle-outline"
                  size={18}
                  color="#EF4444"
                />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={handlePick}>
              <Ionicons
                name="add-circle-outline"
                size={22}
                color={accentColor}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ── Tall box (default — best for images) ─────────────────────────────────

  const showImagePreview = value && isImage(value.mimeType);

  return (
    <View style={{ flex: 1 }}>
      {/* Label row */}
      {label && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 6,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: accentColor,
              textTransform: "uppercase",
              letterSpacing: 0.8,
            }}
          >
            {label}
          </Text>
        </View>
      )}

      {/* Pick area */}
      <Pressable
        onPress={value ? undefined : handlePick}
        style={{
          height,
          borderRadius: 10,
          overflow: "hidden",
          backgroundColor: showImagePreview ? undefined : accentBg,
          borderWidth: 1.5,
          borderColor: value ? "#E5E7EB" : accentColor,
          borderStyle: value ? "solid" : "dashed",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {showImagePreview ? (
          <>
            <Image
              source={{ uri: value.uri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
            {/* Overlay actions */}
            <View
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                flexDirection: "row",
                gap: 6,
              }}
            >
              {/* Replace */}
              <Pressable
                onPress={handlePick}
                style={{
                  backgroundColor: "rgba(0,0,0,0.55)",
                  borderRadius: 99,
                  width: 28,
                  height: 28,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="swap-horizontal-outline"
                  size={14}
                  color="#fff"
                />
              </Pressable>
              {/* Remove */}
              <Pressable
                onPress={handleRemove}
                style={{
                  backgroundColor: "rgba(239,68,68,0.85)",
                  borderRadius: 99,
                  width: 28,
                  height: 28,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={14} color="#fff" />
              </Pressable>
            </View>
          </>
        ) : value ? (
          // Non-image file preview inside tall box
          <View style={{ alignItems: "center", gap: 6, paddingHorizontal: 12 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOpacity: 0.06,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              <Ionicons
                name="document-text-outline"
                size={24}
                color={accentColor}
              />
            </View>
            <Text
              style={{ fontSize: 12, fontWeight: "600", color: "#374151" }}
              numberOfLines={2}
              textBreakStrategy="balanced"
            >
              {truncate(value.name, 36)}
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
              <TouchableOpacity
                onPress={handlePick}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: accentBg,
                  borderRadius: 99,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Ionicons
                  name="swap-horizontal-outline"
                  size={13}
                  color={accentColor}
                />
                <Text
                  style={{
                    fontSize: 11,
                    color: accentColor,
                    fontWeight: "600",
                  }}
                >
                  Replace
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRemove}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: "#FEF2F2",
                  borderRadius: 99,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Ionicons name="trash-outline" size={13} color="#EF4444" />
                <Text
                  style={{ fontSize: 11, color: "#EF4444", fontWeight: "600" }}
                >
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Empty state
          <View style={{ alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOpacity: 0.06,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              <Ionicons
                name={
                  accept === "images" ? "image-outline" : "cloud-upload-outline"
                }
                size={24}
                color={accentColor}
              />
            </View>
            <Text
              style={{ fontSize: 12, color: accentColor, fontWeight: "600" }}
            >
              {hint ?? (accept === "images" ? "Add photo" : "Choose file")}
            </Text>
            <Text style={{ fontSize: 10, color: "#9CA3AF" }}>
              {accept === "images" ? "JPG, PNG, WEBP" : "Any file type"}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}
