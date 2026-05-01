import { useGetBuildingImprovementById } from "@/src/api/buildingImprovements.api";
import ErrorState from "@/src/components/feedback/ErrorState";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import Card from "@/src/components/ui/Card";
import { BASE_URL } from "@/src/constants/env";
import { formatDateTime } from "@/src/helper/formatDateTime";
import {
  BuildingImprovementImageResponse,
  BuildingImprovementResponse,
  projectLabel,
  subProjectLabel,
} from "@/src/types/building-improvements.type";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Constants ────────────────────────────────────────────────────────────────

const SCREEN_WIDTH = Dimensions.get("window").width;

function resolveImage(img: BuildingImprovementImageResponse): string {
  const path = img.fileUrl ?? img.storedPath ?? "";
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/api"))
    return `${BASE_URL.replace(/\/api$/, "")}${path}`;
  return `${BASE_URL}${path}`;
}

function getSide(img: BuildingImprovementImageResponse) {
  return img.imageSide ?? img.side;
}

// ─── Full-screen image viewer ─────────────────────────────────────────────────

function ImageViewer({
  images,
  startIndex,
  onClose,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(startIndex);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.95)" barStyle="light-content" />
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)" }}>
        {/* Close */}
        <Pressable
          onPress={onClose}
          style={{
            position: "absolute",
            top: 48,
            right: 16,
            zIndex: 10,
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: 99,
            width: 36,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="close" size={20} color="#fff" />
        </Pressable>

        {/* Counter */}
        {images.length > 1 && (
          <Text
            style={{
              position: "absolute",
              top: 56,
              alignSelf: "center",
              color: "rgba(255,255,255,0.7)",
              fontSize: 13,
              zIndex: 10,
            }}
          >
            {current + 1} / {images.length}
          </Text>
        )}

        {/* Image */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(
              e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
            );
            setCurrent(idx);
          }}
          contentOffset={{ x: startIndex * SCREEN_WIDTH, y: 0 }}
          scrollEnabled={images.length > 1}
        >
          {images.map((uri, i) => (
            <View
              key={i}
              style={{
                width: SCREEN_WIDTH,
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={{ uri }}
                style={{ width: SCREEN_WIDTH, height: "100%" }}
                resizeMode="contain"
              />
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

function BeforeAfterImageGrids({
  before,
  after,
  allUris,
}: {
  before: BuildingImprovementImageResponse[];
  after: BuildingImprovementImageResponse[];
  allUris: string[];
}) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (before.length === 0 && after.length === 0) {
    return (
      <View
        style={{
          height: 100,
          borderRadius: 12,
          backgroundColor: "#F3F4F6",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 13, color: "#9CA3AF" }}>
          No images attached
        </Text>
      </View>
    );
  }

  // 👇 make both sides equal length for alignment
  const maxLength = Math.max(before.length, after.length);

  const paddedBefore = [...before];
  const paddedAfter = [...after];

  while (paddedBefore.length < maxLength) paddedBefore.push(null as any);
  while (paddedAfter.length < maxLength) paddedAfter.push(null as any);

  const renderGrid = (
    images: (BuildingImprovementImageResponse | null)[],
    uriOffset: number,
  ) => {
    return (
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {images.map((img, i) => {
          if (!img) {
            return (
              <View
                key={i}
                style={{
                  width: "100%",
                  aspectRatio: 1,
                }}
              />
            );
          }

          const uri = resolveImage(img);
          const globalIdx = uriOffset + i;

          return (
            <TouchableOpacity
              key={img.id}
              activeOpacity={0.85}
              onPress={() => setViewerIndex(globalIdx)}
              style={{
                width: "100%",
                aspectRatio: 1,
                borderRadius: 10,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "#E5E7EB",
                backgroundColor: "#F3F4F6",
              }}
            >
              <Image
                source={{ uri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />

              {/* ✅ ADD THIS BACK */}
              <View
                style={{
                  position: "absolute",
                  bottom: 6,
                  right: 6,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  borderRadius: 999,
                  padding: 4,
                }}
              >
                <Ionicons name="expand-outline" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderColumn = (
    images: (BuildingImprovementImageResponse | null)[],
    label: "Before" | "After",
    uriOffset: number,
  ) => {
    const dot = label === "Before" ? "#F59E0B" : "#10B981";
    const labelColor = label === "Before" ? "#B45309" : "#065F46";

    return (
      <View style={{ flex: 1 }}>
        {/* Label */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 8,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: dot,
            }}
          />
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: labelColor,
              textTransform: "uppercase",
            }}
          >
            {label}
          </Text>
        </View>

        {renderGrid(images, uriOffset)}
      </View>
    );
  };

  return (
    <>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {renderColumn(paddedBefore, "Before", 0)}
        {renderColumn(paddedAfter, "After", before.length)}
      </View>

      {viewerIndex !== null && (
        <ImageViewer
          images={allUris}
          startIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
        gap: 12,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          color: "#6B7280",
          fontWeight: "500",
          flexShrink: 0,
        }}
      >
        {label}
      </Text>
      <View style={{ flex: 1, alignItems: "flex-end" }}>{children}</View>
    </View>
  );
}

function Badge({
  label,
  bg,
  color,
}: {
  label: string;
  bg: string;
  color: string;
}) {
  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 99,
        paddingHorizontal: 10,
        paddingVertical: 3,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "600", color }}>{label}</Text>
    </View>
  );
}

function SectionLabel({ title }: { title: string }) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: "700",
        color: "#9CA3AF",
        textTransform: "uppercase",
        letterSpacing: 1,
        paddingTop: 12,
        paddingBottom: 4,
      }}
    >
      {title}
    </Text>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ImprovementDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const numericId = id ? Number(id) : undefined;

  const { data, isLoading, isError, refetch } = useGetBuildingImprovementById(
    numericId,
    !!numericId,
  );

  // ── Loading ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return <LoadingState message="Loading improvement details..." />;
  }

  // ── Error ────────────────────────────────────────────────────────────────

  if (isError || !data?.data) {
    return (
      <ErrorState
        title="Not Found"
        message="Could not load improvement details."
        onRetry={refetch}
      />
    );
  }

  const item = data.data as BuildingImprovementResponse;
  const images = item.images ?? [];

  const beforeImages = images.filter((img) => getSide(img) === "BEFORE");
  const afterImages = images.filter((img) => getSide(img) === "AFTER");

  // Flat ordered URI list for the viewer: all befores first, then afters
  const allUris = [
    ...beforeImages.map(resolveImage),
    ...afterImages.map(resolveImage),
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1 }}>
      <PageHeader
        title="Improvement Details"
        subtitle={projectLabel(item.project)}
        icon="hammer"
        showBackButton
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Before / After Photos ── */}
        {images.length > 0 && (
          <Card className="px-4 pt-3 pb-2 mb-4">
            <SectionLabel title="Photos" />
            <View>
              <BeforeAfterImageGrids
                before={beforeImages}
                after={afterImages}
                allUris={allUris}
              />
            </View>
          </Card>
        )}

        {/* ── Project Info ── */}
        <Card className="px-4 py-1 mb-4">
          <SectionLabel title="Project" />

          <InfoRow label="Category">
            <Badge
              label={projectLabel(item.project)}
              bg="#EEF2FF"
              color="#4F46E5"
            />
          </InfoRow>

          {item.subProject ? (
            <InfoRow label="Sub-category">
              <Badge
                label={subProjectLabel(item.subProject)}
                bg="#F0FDF4"
                color="#16A34A"
              />
            </InfoRow>
          ) : null}

          <InfoRow label="Work Date">
            <Text style={{ fontSize: 13, fontWeight: "500", color: "#111827" }}>
              {formatDateTime(item.workDate)}
            </Text>
          </InfoRow>

          {item.location ? (
            <InfoRow label="Location">
              <Text
                style={{
                  fontSize: 13,
                  color: "#374151",
                  textAlign: "right",
                  flexShrink: 1,
                }}
              >
                {item.location}
              </Text>
            </InfoRow>
          ) : null}
        </Card>

        {/* ── Detail of Work ── */}
        <Card className="px-4 py-1 mb-4">
          <SectionLabel title="Details of Work" />
          <Text
            style={{
              fontSize: 14,
              color: "#374151",
              lineHeight: 22,
              paddingBottom: 14,
              paddingTop: 6,
            }}
          >
            {item.detailOfWork || "No details provided."}
          </Text>
        </Card>

        {/* ── Record Info ── */}
        <Card className="px-4 py-1 mb-4">
          <SectionLabel title="Record Info" />

          {item.buildingName ? (
            <InfoRow label="Building">
              <Text style={{ fontSize: 13, color: "#374151" }}>
                {item.buildingName}
              </Text>
            </InfoRow>
          ) : null}

          <InfoRow label="Created By">
            <Text style={{ fontSize: 13, color: "#374151" }}>
              {item.createdByUserName ?? "—"}
            </Text>
          </InfoRow>

          <InfoRow label="Attached Images">
            <Text style={{ fontSize: 13, color: "#374151" }}>
              {images.length > 0
                ? `${images.length} photo${images.length > 1 ? "s" : ""}`
                : "None"}
            </Text>
          </InfoRow>
        </Card>
      </ScrollView>
    </View>
  );
}
