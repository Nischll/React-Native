import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
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
  accept?: FilePickerAccept;
  label?: string;
  hint?: string;
  // ── single mode (legacy) ──
  value?: PickedFile | null;
  onChange?: (file: PickedFile | null) => void;
  // ── multi mode ──
  multiple?: boolean;
  values?: PickedFile[];
  onChangeMultiple?: (files: PickedFile[]) => void;
  accentColor?: string;
  accentBg?: string;
  height?: number;
  compact?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isImage(mimeType: string) {
  return mimeType.startsWith("image/");
}

function truncate(str: string, max = 30) {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

function getMimeTypes(accept: FilePickerAccept) {
  if (accept === "images") return ["image/*"];
  if (accept === "files") return ["*/*"];
  return ["image/*", "*/*"];
}

// ─── Multi-file compact list ──────────────────────────────────────────────────

function MultiFileCompact({
  values,
  onChangeMultiple,
  accept,
  accentColor,
  accentBg,
  label,
  hint,
}: {
  values: PickedFile[];
  onChangeMultiple: (files: PickedFile[]) => void;
  accept: FilePickerAccept;
  accentColor: string;
  accentBg: string;
  label?: string;
  hint?: string;
}) {
  async function handleAdd() {
    const result = await DocumentPicker.getDocumentAsync({
      type: getMimeTypes(accept),
      copyToCacheDirectory: true,
      multiple: true,
    });
    if (result.canceled || !result.assets?.length) return;
    const newFiles: PickedFile[] = result.assets.map((a) => ({
      uri: a.uri,
      name: a.name,
      mimeType: a.mimeType ?? "application/octet-stream",
      isLocal: true,
    }));
    onChangeMultiple([...values, ...newFiles]);
  }

  function handleRemove(index: number) {
    onChangeMultiple(values.filter((_, i) => i !== index));
  }

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

      {/* Existing picked files */}
      {values.map((file, index) => (
        <View
          key={`${file.uri}-${index}`}
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1.5,
            borderColor: "#D1D5DB",
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: "#fff",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: "#F3F4F6",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isImage(file.mimeType) ? (
              <Image
                source={{ uri: file.uri }}
                style={{ width: 36, height: 36, borderRadius: 8 }}
                resizeMode="cover"
              />
            ) : (
              <Ionicons
                name="document-text-outline"
                size={20}
                color="#6B7280"
              />
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 13, fontWeight: "600", color: "#111827" }}
              numberOfLines={1}
            >
              {truncate(file.name)}
            </Text>
            <Text style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>
              {file.isLocal ? "New — ready to upload" : "Existing file"}
            </Text>
          </View>

          <TouchableOpacity onPress={() => handleRemove(index)}>
            <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ))}

      {/* Add more button */}
      <TouchableOpacity
        onPress={handleAdd}
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1.5,
          borderColor: accentColor,
          borderStyle: "dashed",
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: accentBg,
          gap: 10,
        }}
      >
        <Ionicons name="add-circle-outline" size={22} color={accentColor} />
        <Text style={{ fontSize: 13, color: accentColor, fontWeight: "600" }}>
          {hint ??
            (values.length > 0 ? "Add more files" : "Tap to choose files")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FilePicker({
  accept = "images",
  label,
  hint,
  value,
  onChange,
  multiple = false,
  values = [],
  onChangeMultiple,
  accentColor = "#4F46E5",
  accentBg = "#EEF2FF",
  height = 140,
  compact = false,
}: FilePickerProps) {
  // ── Multi mode ────────────────────────────────────────────────────────────
  if (multiple && onChangeMultiple) {
    return (
      <MultiFileCompact
        values={values}
        onChangeMultiple={onChangeMultiple}
        accept={accept}
        accentColor={accentColor}
        accentBg={accentBg}
        label={label}
        hint={hint}
      />
    );
  }

  // ── Single compact mode ───────────────────────────────────────────────────
  async function handlePick() {
    const result = await DocumentPicker.getDocumentAsync({
      type: getMimeTypes(accept),
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    onChange?.({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? "application/octet-stream",
      isLocal: true,
    });
  }

  function handleRemove() {
    onChange?.(null);
  }

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

          <View style={{ flex: 1 }}>
            {value ? (
              <>
                <Text
                  style={{ fontSize: 13, fontWeight: "600", color: "#111827" }}
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

  // ── Tall box ──────────────────────────────────────────────────────────────
  const showImagePreview = value && isImage(value.mimeType);

  return (
    <View style={{ flex: 1 }}>
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
            <View
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                flexDirection: "row",
                gap: 6,
              }}
            >
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
          <View style={{ alignItems: "center", gap: 6, paddingHorizontal: 12 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
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
          <View style={{ alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
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
