import { useGetBuildingImprovementById } from "@/src/api/buildingImprovements.api";
import ErrorState from "@/src/components/feedback/ErrorState";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import { BASE_URL } from "@/src/constants/env";
import { formatDateTime } from "@/src/helper/formatDateTime";
import {
  BuildingImprovementImageResponse,
  BuildingImprovementResponse,
  projectLabel,
  subProjectLabel,
} from "@/src/types/building-improvements.type";
import { useRoute } from "@react-navigation/native";
import { Image, ScrollView, Text, View } from "react-native";

export function ImprovementDetails() {
  const route = useRoute<any>();
  const id: number | undefined = route.params?.id;

  const { data, isLoading, isError, refetch } = useGetBuildingImprovementById(
    id,
    !!id,
  );

  const item: BuildingImprovementResponse | undefined = data?.data as any; // adjust if your API wraps differently

  // ─── Loading ─────────────────────────────
  if (isLoading) {
    return <LoadingState />;
  }

  // ─── Error ───────────────────────────────
  if (isError || !item) {
    return (
      <ErrorState
        title="Building Improvement Details"
        message="Failed to load data."
      />
    );
  }

  // ─── Helpers ─────────────────────────────
  const getSide = (img: BuildingImprovementImageResponse) =>
    img.imageSide ?? img.side;

  const beforeImages =
    item.images?.filter((img) => getSide(img) === "BEFORE") ?? [];

  const afterImages =
    item.images?.filter((img) => getSide(img) === "AFTER") ?? [];

  const resolveImage = (img: BuildingImprovementImageResponse) => {
    const path = img.fileUrl || img.storedPath || "";

    if (!path) return "";

    // already full URL
    if (path.startsWith("http://")) return path;
    if (path.startsWith("/api")) {
      return `${BASE_URL.replace(/\/api$/, "")}${path}`;
    }
    // make full URL
    return `${BASE_URL}${path}`;
  };

  // ─── UI ──────────────────────────────────
  return (
    <View style={{ flex: 1 }}>
      <PageHeader
        icon="hammer"
        title="Improvement Details"
        subtitle="View full work details and images"
        showBackButton
      />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "700" }}>
            {projectLabel(String(item.project))}
          </Text>

          {item.subProject && (
            <Text style={{ color: "#6B7280", marginTop: 4 }}>
              {subProjectLabel(item.subProject)}
            </Text>
          )}
        </View>

        {/* Meta */}
        <View style={{ gap: 8, marginBottom: 16 }}>
          <Text>📅 {formatDateTime(item.workDate)}</Text>
          <Text>🏢 {item.buildingName || "—"}</Text>
          <Text>📍 {item.location || "Not specified"}</Text>
          <Text>👤 {item.createdByUserName || "—"}</Text>
        </View>

        {/* Detail */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontWeight: "600", marginBottom: 6 }}>
            Detail of Work
          </Text>
          <Text style={{ color: "#374151" }}>{item.detailOfWork || "—"}</Text>
        </View>

        {/* Before Images */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontWeight: "700", marginBottom: 10 }}>
            Before Images
          </Text>

          {beforeImages.length === 0 ? (
            <Text style={{ color: "#9CA3AF" }}>No before images</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {beforeImages.map((img) => (
                <Image
                  key={img.id}
                  source={{ uri: resolveImage(img) }}
                  style={{
                    width: 140,
                    height: 140,
                    borderRadius: 10,
                    marginRight: 10,
                  }}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* After Images */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontWeight: "700", marginBottom: 10 }}>
            After Images
          </Text>

          {afterImages.length === 0 ? (
            <Text style={{ color: "#9CA3AF" }}>No after images</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {afterImages.map((img) => (
                <Image
                  key={img.id}
                  source={{ uri: resolveImage(img) }}
                  style={{
                    width: 140,
                    height: 140,
                    borderRadius: 10,
                    marginRight: 10,
                  }}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
