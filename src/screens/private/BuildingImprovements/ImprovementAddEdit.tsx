import {
  useCreateBuildingImprovement,
  useGetBuildingImprovementById,
  useUpdateBuildingImprovement,
} from "@/src/api/buildingImprovements.api";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import DatePickerField from "@/src/components/ui/DatePickerField";
import { FilePicker, PickedFile } from "@/src/components/ui/FilePicker";
import SelectField from "@/src/components/ui/SelectField";
import TextAreaField from "@/src/components/ui/TextAreaFeld";
import { BASE_URL } from "@/src/constants/env";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  BUILDING_IMPROVEMENT_PROJECTS,
  BuildingImprovementProject,
  allowsSubProjects,
  projectLabel,
  subProjectLabel,
  subProjectsForParent,
} from "@/src/types/building-improvements.type";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Platform, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

function resolveUri(fileUrl?: string): string {
  if (!fileUrl) return "";
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://"))
    return fileUrl;
  if (fileUrl.startsWith("/api"))
    return `${BASE_URL.replace(/\/api$/, "")}${fileUrl}`;
  return `${BASE_URL}${fileUrl}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormValues {
  project: string;
  subProject: string;
  location: string;
  workDate: string;
  detailOfWork: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toOptions(values: readonly string[], labelFn: (v: string) => string) {
  return values.map((v) => ({ label: labelFn(v), value: v }));
}

function todayIso(): string {
  return new Date().toISOString();
}

// ─── Section Heading ──────────────────────────────────────────────────────────

function SectionHeading({ title }: { title: string }) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: "700",
        color: "#9CA3AF",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 10,
        marginTop: 20,
      }}
    >
      {title}
    </Text>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ImprovementAddEdit() {
  const { improvementId } = useLocalSearchParams();
  const id = improvementId ? Number(improvementId) : undefined;
  const editMode = !!id;

  const { buildingId } = useAuth();

  const { data: existingData, isLoading: loadingExisting } =
    useGetBuildingImprovementById(id, editMode);
  const { mutate: createImprovement, isPending: creating } =
    useCreateBuildingImprovement();
  const { mutate: updateImprovement, isPending: updating } =
    useUpdateBuildingImprovement(id);

  const [beforeImage, setBeforeImage] = useState<PickedFile | null>(null);
  const [afterImage, setAfterImage] = useState<PickedFile | null>(null);

  const { control, handleSubmit, watch, setValue, reset } = useForm<FormValues>(
    {
      defaultValues: {
        project: "",
        subProject: "",
        location: "",
        workDate: todayIso(),
        detailOfWork: "",
      },
    },
  );

  const selectedProject = watch("project") as BuildingImprovementProject | "";
  const showSubProject =
    !!selectedProject && allowsSubProjects(selectedProject);
  const subProjectOptions = showSubProject
    ? toOptions(
        subProjectsForParent(selectedProject).map((s) => s.value),
        subProjectLabel,
      )
    : [];

  // ── Edit mode: populate form + images ───────────────────────────────────

  useEffect(() => {
    if (!editMode || !existingData?.data) return;
    const item = existingData.data;

    reset({
      project: item.project ?? "",
      subProject: item.subProject ?? "",
      location: item.location ?? "",
      // Keep full ISO so DatePickerField can parse it correctly
      workDate: item.workDate ?? todayIso(),
      detailOfWork: item.detailOfWork ?? "",
    });

    const images = item.images ?? [];
    const before = images.find(
      (img) => (img.imageSide ?? img.side) === "BEFORE",
    );
    const after = images.find((img) => (img.imageSide ?? img.side) === "AFTER");

    if (before?.fileUrl) {
      setBeforeImage({
        // FIX: resolve relative API path → absolute URL so <Image> can render it
        uri: resolveUri(before.fileUrl),
        name: before.originalFileName ?? before.fileName ?? "before.jpg",
        mimeType: "image/jpeg",
        isLocal: false, // remote — skip binary re-upload unless replaced
      });
    }
    if (after?.fileUrl) {
      setAfterImage({
        uri: resolveUri(after.fileUrl),
        name: after.originalFileName ?? after.fileName ?? "after.jpg",
        mimeType: "image/jpeg",
        isLocal: false,
      });
    }
  }, [editMode, existingData]);

  // Reset subProject when project changes (but not on initial edit-mode load)
  const [projectInitialized, setProjectInitialized] = useState(false);
  useEffect(() => {
    if (!projectInitialized) {
      // Skip the very first emission so edit-mode subProject isn't wiped
      setProjectInitialized(true);
      return;
    }
    setValue("subProject", "");
  }, [selectedProject]);

  // ── Submit ────────────────────────────────────────────────────────────────

  const onSubmit = (values: FormValues) => {
    if (!buildingId) return;

    const form = new FormData();
    form.append("buildingId", String(buildingId));
    form.append("project", values.project);
    if (values.subProject) form.append("subProject", values.subProject);
    if (values.location) form.append("location", values.location);
    // Backend expects YYYY-MM-DD — extract date part from ISO string
    form.append("workDate", values.workDate.split("T")[0]);
    form.append("detailOfWork", values.detailOfWork);

    // Only append binary if user picked a NEW local file
    if (beforeImage?.isLocal) {
      form.append("beforeImages", {
        uri:
          Platform.OS === "android"
            ? beforeImage.uri
            : beforeImage.uri.replace("file://", ""),
        name: beforeImage.name,
        type: beforeImage.mimeType,
      } as any);
    }

    if (afterImage?.isLocal) {
      form.append("afterImages", {
        uri:
          Platform.OS === "android"
            ? afterImage.uri
            : afterImage.uri.replace("file://", ""),
        name: afterImage.name,
        type: afterImage.mimeType,
      } as any);
    }

    const onSuccess = () => router.back();
    if (editMode) {
      updateImprovement(form as any, { onSuccess });
    } else {
      createImprovement(form as any, { onSuccess });
    }
  };

  // ── Loading guard ─────────────────────────────────────────────────────────

  if (editMode && loadingExisting) {
    return <LoadingState message="Loading improvement details..." />;
  }

  const projectOptions = toOptions(
    BUILDING_IMPROVEMENT_PROJECTS as unknown as string[],
    projectLabel,
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1 }}>
      <PageHeader
        showBackButton
        icon="hammer"
        title={editMode ? "Edit Improvement" : "Add Improvement"}
        subtitle={
          editMode
            ? "Update the improvement record"
            : "Log a new building improvement"
        }
      />

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 80,
        }}
        enableOnAndroid
        extraScrollHeight={100}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableAutomaticScroll
      >
        {/* ── Photos ────────────────────────────────────────────────────── */}
        <SectionHeading title="Photos" />

        <View style={{ flexDirection: "row", gap: 12 }}>
          <FilePicker
            accept="images"
            label="Before"
            hint="Add before photo"
            value={beforeImage}
            onChange={setBeforeImage}
            accentColor="#B45309"
            accentBg="#FFF7ED"
            height={150}
          />
          <FilePicker
            accept="images"
            label="After"
            hint="Add after photo"
            value={afterImage}
            onChange={setAfterImage}
            accentColor="#065F46"
            accentBg="#F0FDF4"
            height={150}
          />
        </View>

        {/* ── Project ───────────────────────────────────────────────────── */}
        <SectionHeading title="Project" />

        <Controller
          control={control}
          name="project"
          rules={{ required: "Project category is required" }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <SelectField
                label="Category"
                value={value}
                onChange={onChange}
                options={projectOptions}
                placeholder="Select project category"
              />
              {error && (
                <Text style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>
                  {error.message}
                </Text>
              )}
            </>
          )}
        />

        {showSubProject && subProjectOptions.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Controller
              control={control}
              name="subProject"
              render={({ field: { onChange, value } }) => (
                <SelectField
                  label="Sub-category"
                  value={value}
                  onChange={onChange}
                  options={subProjectOptions}
                  placeholder="Select sub-category"
                  mode="dropdown"
                />
              )}
            />
          </View>
        )}

        {/* Work Date — using your DatePickerField */}
        <View style={{ marginTop: 12 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Work Date
          </Text>
          <Controller
            control={control}
            name="workDate"
            rules={{ required: "Work date is required" }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <>
                <DatePickerField
                  value={value}
                  onChange={onChange}
                  placeholder="Select work date"
                  showTime={false}
                />
                {error && (
                  <Text
                    style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}
                  >
                    {error.message}
                  </Text>
                )}
              </>
            )}
          />
        </View>

        {/* ── Details ───────────────────────────────────────────────────── */}
        <SectionHeading title="Details" />

        {/* Location — plain text input (no dedicated component needed) */}
        <Controller
          control={control}
          name="location"
          render={({ field: { onChange, value } }) => (
            <View>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                Location
              </Text>
              <AppInput
                value={value}
                onChangeText={onChange}
                placeholder="Where was the work done?"
              />
            </View>
          )}
        />

        {/* Detail of Work — using your TextAreaField */}
        <View style={{ marginTop: 12 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Detail of Work
          </Text>
          <Controller
            control={control}
            name="detailOfWork"
            rules={{ required: "Please describe the work performed" }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <>
                <TextAreaField
                  value={value}
                  onChangeText={onChange}
                  placeholder="Describe the work performed..."
                />
                {error && (
                  <Text
                    style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}
                  >
                    {error.message}
                  </Text>
                )}
              </>
            )}
          />
        </View>

        {/* ── Submit ────────────────────────────────────────────────────── */}
        <View style={{ marginTop: 28 }}>
          <AppButton
            loading={editMode ? updating : creating}
            onPress={handleSubmit(onSubmit)}
          >
            {editMode ? "Update Improvement" : "Save Improvement"}
          </AppButton>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
