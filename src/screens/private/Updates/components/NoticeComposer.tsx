import {
  useCreateCommunicationWithRefresh,
  useUpdateCommunicationWithRefresh,
} from "@/src/api/communication.api";
import FormSheetModal from "@/src/components/domain/FormSheetModal";
import AppIcon from "@/src/components/ui/AppIcon";
import {
  MentionState,
  MentionSuggestions,
  MentionTextInput,
} from "@/src/helper/mentionTextInput";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  CommunicationGroup,
  CommunicationItem,
} from "@/src/types/communication.types";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

type Audience = "everyone" | "buildings";

export function NoticeComposer({
  visible,
  onClose,
  selectedGroup,
  editingItem,
  mentionBuildingId,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  selectedGroup: CommunicationGroup | null;
  editingItem: CommunicationItem | null;
  mentionBuildingId?: number | null;
  onSaved?: () => void;
}) {
  const [text, setText] = useState("");
  const [mentionState, setMentionState] = useState<MentionState | null>(null);
  const [audience, setAudience] = useState<Audience>("buildings");
  const { user, selectedBuilding } = useAuth();
  const { mutate: create, isPending: creating } =
    useCreateCommunicationWithRefresh();
  const { mutate: update, isPending: updating } =
    useUpdateCommunicationWithRefresh();

  const buildingOptions = user?.buildingList ?? [];
  const defaultBuildingId =
    typeof selectedGroup?.id === "number"
      ? selectedGroup.id
      : selectedBuilding
        ? Number(selectedBuilding.value)
        : buildingOptions[0]
          ? Number(buildingOptions[0].value)
          : null;

  const [buildingIds, setBuildingIds] = useState<number[]>([]);
  const isEditingReply =
    editingItem != null &&
    editingItem.parentId != null &&
    editingItem.parentId !== undefined;
  const saving = creating || updating;

  useEffect(() => {
    if (!visible) return;
    setMentionState(null);
    if (editingItem) {
      setText(editingItem.message || "");
      if (isEditingReply) {
        setAudience("buildings");
        setBuildingIds([]);
        return;
      }
      const ids = (editingItem.buildingIds ?? []).filter(
        (id): id is number => typeof id === "number",
      );
      setAudience(ids.length === 0 ? "everyone" : "buildings");
      setBuildingIds(ids);
      return;
    }
    setText("");
    if (selectedGroup?.id === "everyone") {
      setAudience("everyone");
      setBuildingIds([]);
      return;
    }
    setAudience("buildings");
    setBuildingIds(defaultBuildingId ? [defaultBuildingId] : []);
  }, [visible, editingItem, selectedGroup, defaultBuildingId, isEditingReply]);

  const selectedLabels = useMemo(() => {
    return buildingOptions
      .filter((b) => buildingIds.includes(Number(b.value)))
      .map((b) => b.label.split("(")[0]?.trim() || b.label);
  }, [buildingOptions, buildingIds]);

  const canSend =
    text.trim().length > 0 &&
    (isEditingReply || audience === "everyone" || buildingIds.length > 0);

  const handleClose = () => {
    setText("");
    setMentionState(null);
    onClose();
  };

  const handleSaved = () => {
    onSaved?.();
    handleClose();
  };

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed || !canSend) return;

    if (editingItem?.id) {
      update(
        {
          id: editingItem.id,
          message: trimmed,
          parentId: editingItem.parentId ?? null,
          ...(isEditingReply
            ? {}
            : audience === "everyone"
              ? { buildingIds: undefined }
              : { buildingIds }),
        },
        { onSuccess: handleSaved },
      );
      return;
    }

    create(
      audience === "everyone"
        ? { message: trimmed }
        : { message: trimmed, buildingIds },
      { onSuccess: handleSaved },
    );
  };

  const toggleBuilding = (id: number) => {
    setBuildingIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const title = editingItem
    ? isEditingReply
      ? "Edit reply"
      : "Edit message"
    : "Add message";

  return (
    <FormSheetModal
      visible={visible}
      title={title}
      submitLabel={editingItem ? "Update" : "Post"}
      loading={saving}
      submitDisabled={!canSend || saving}
      onClose={handleClose}
      onSubmit={handleSave}
    >
      <Text className="mb-2 text-sm font-semibold text-textPrimary">
        Message
      </Text>
      <MentionTextInput
        value={text}
        onChangeText={setText}
        onMentionStateChange={setMentionState}
        placeholder="Enter message… Type @ to mention someone"
        placeholderTextColor="#CBD5E1"
        multiline
        editable={isEditingReply || audience === "everyone" || buildingIds.length > 0}
        style={{
          fontSize: 14,
          color: "#1E293B",
          minHeight: 120,
          maxHeight: 200,
          lineHeight: 22,
          borderWidth: 1,
          borderColor: "#E2E8F0",
          borderRadius: 12,
          padding: 12,
          backgroundColor: "#fff",
        }}
      />
      {mentionState ? (
        <MentionSuggestions
          mentionState={mentionState}
          value={text}
          onChangeText={setText}
          onDismiss={() => setMentionState(null)}
          buildingId={mentionBuildingId}
          direction="below"
        />
      ) : null}

      {!isEditingReply ? (
        <View className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <View className="mb-3 flex-row items-center gap-2">
            <AppIcon name="business-outline" size={16} color="#7C3AED" />
            <Text className="text-sm font-semibold text-textPrimary">
              Audience
            </Text>
          </View>

          <Pressable
            onPress={() => {
              setAudience("everyone");
              setBuildingIds([]);
            }}
            className={`mb-2 flex-row items-start gap-3 rounded-lg border bg-white px-3 py-3 ${
              audience === "everyone" ? "border-primary" : "border-slate-200"
            }`}
          >
            <View
              className={`mt-0.5 h-5 w-5 items-center justify-center rounded border ${
                audience === "everyone"
                  ? "border-primary bg-primary"
                  : "border-slate-300"
              }`}
            >
              {audience === "everyone" ? (
                <AppIcon name="checkmark" size={12} color="#fff" />
              ) : null}
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-textPrimary">
                Everyone
              </Text>
              <Text className="mt-0.5 text-xs text-textSecondary">
                Broadcast this message across every building you manage.
              </Text>
            </View>
          </Pressable>

          {audience !== "everyone" ? (
            <>
              <Text className="mb-2 text-xs text-textSecondary">
                Choose one or more buildings. Leave Everyone unchecked to post
                only to those buildings.
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {buildingOptions.map((b) => {
                  const id = Number(b.value);
                  const on = buildingIds.includes(id);
                  return (
                    <Pressable
                      key={b.value}
                      onPress={() => toggleBuilding(id)}
                      className={`rounded-full border px-2.5 py-1.5 ${
                        on
                          ? "border-green-600 bg-green-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          on ? "text-green-700" : "text-slate-500"
                        }`}
                      >
                        {b.label.split("(")[0]?.trim() || b.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {buildingIds.length === 0 ? (
                <Text className="mt-2 text-xs font-medium text-amber-800">
                  Select at least one building, or check Everyone.
                </Text>
              ) : (
                <Text className="mt-2 text-xs text-slate-400">
                  Sending to {selectedLabels.join(", ")}
                </Text>
              )}
            </>
          ) : (
            <Text className="rounded-lg bg-violet-50 px-3 py-2.5 text-xs text-violet-900">
              This message will be visible to staff across all buildings.
            </Text>
          )}
        </View>
      ) : null}
    </FormSheetModal>
  );
}
