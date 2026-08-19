import FormSheetModal from "@/src/components/domain/FormSheetModal";
import AppButton from "@/src/components/ui/AppButton";
import {
  draftsAreComplete,
  promptOcpPhotoSource,
} from "@/src/helper/ocpMedia";
import {
  OcpAttachment,
  OcpDraftPhoto,
  OcpPhotoStatus,
  isOcpNotNormal,
} from "@/src/types/overnightConciergePatrol.types";
import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { OcpPhotoMetaFields, OcpStatusBadge } from "./OcpPhotoFields";
import OcpRemoteImage from "./OcpRemoteImage";

type EditState = {
  title: string;
  area: string;
  status: OcpPhotoStatus;
  description: string;
  file?: { uri: string; name: string; mimeType: string } | null;
};

function toEditState(att: OcpAttachment): EditState {
  return {
    title: att.title ?? att.originalFileName ?? "",
    area: att.area ?? "",
    status: isOcpNotNormal(att.status) ? "NOT_NORMAL" : "NORMAL",
    description: att.description ?? "",
    file: null,
  };
}

export default function AttachmentsSheet({
  visible,
  dutyTitle,
  attachments,
  adding,
  updatingId,
  deletingId,
  onClose,
  onPreview,
  onUncheck,
  onUpdate,
  onDelete,
  onAddMore,
}: {
  visible: boolean;
  dutyTitle: string;
  attachments: OcpAttachment[];
  adding: boolean;
  updatingId: number | null;
  deletingId: number | null;
  onClose: () => void;
  onPreview: (attachment: OcpAttachment) => void;
  onUncheck: () => void;
  onUpdate: (id: number, draft: EditState) => void;
  onDelete: (attachment: OcpAttachment) => void;
  onAddMore: (photos: OcpDraftPhoto[]) => Promise<boolean> | boolean | void;
}) {
  const [edits, setEdits] = useState<Record<number, EditState>>({});
  const [drafts, setDrafts] = useState<OcpDraftPhoto[]>([]);

  useEffect(() => {
    if (!visible) {
      setDrafts([]);
      return;
    }
    const next: Record<number, EditState> = {};
    for (const att of attachments) {
      next[att.id] = toEditState(att);
    }
    setEdits(next);
  }, [visible, attachments]);

  const updateDraft = (key: string, patch: Partial<OcpDraftPhoto>) => {
    setDrafts((prev) =>
      prev.map((p) => (p.key === key ? { ...p, ...patch } : p)),
    );
  };

  const canAddMore = draftsAreComplete(drafts);

  return (
    <FormSheetModal
      visible={visible}
      title="Patrol photos"
      subtitle={dutyTitle}
      hideSubmit
      onClose={onClose}
    >
      {attachments.length === 0 && drafts.length === 0 ? (
        <Text className="text-sm text-textSecondary mb-3">
          No photos saved yet. Add photos below.
        </Text>
      ) : null}

      {attachments.map((att) => {
        const edit = edits[att.id] ?? toEditState(att);
        const canUpdate =
          edit.title.trim().length > 0 && edit.area.trim().length > 0;
        return (
          <View
            key={att.id}
            className="mb-4 rounded-xl border border-slate-200 p-3"
          >
            <View className="flex-row items-center justify-between mb-2">
              <OcpStatusBadge status={edit.status} />
              <Text className="text-[11px] text-slate-400">#{att.id}</Text>
            </View>
            <Pressable onPress={() => onPreview(att)}>
              {edit.file ? (
                <Image
                  source={{ uri: edit.file.uri }}
                  className="w-full h-36 rounded-lg mb-3 bg-slate-100"
                  resizeMode="cover"
                />
              ) : (
                <OcpRemoteImage
                  fileUrl={att.fileUrl}
                  className="w-full h-36 rounded-lg mb-3 bg-slate-100"
                />
              )}
            </Pressable>
            <OcpPhotoMetaFields
              title={edit.title}
              area={edit.area}
              status={edit.status}
              description={edit.description}
              onChangeTitle={(title) =>
                setEdits((prev) => ({
                  ...prev,
                  [att.id]: { ...edit, title },
                }))
              }
              onChangeArea={(area) =>
                setEdits((prev) => ({
                  ...prev,
                  [att.id]: { ...edit, area },
                }))
              }
              onChangeStatus={(status) =>
                setEdits((prev) => ({
                  ...prev,
                  [att.id]: { ...edit, status },
                }))
              }
              onChangeDescription={(description) =>
                setEdits((prev) => ({
                  ...prev,
                  [att.id]: { ...edit, description },
                }))
              }
            />
            <View className="flex-row gap-2 mt-3">
              <View className="flex-1">
                <AppButton
                  variant="outline"
                  size="sm"
                  onPress={() =>
                    promptOcpPhotoSource((photos) => {
                      const first = photos[0];
                      if (!first) return;
                      setEdits((prev) => ({
                        ...prev,
                        [att.id]: {
                          ...edit,
                          file: {
                            uri: first.uri,
                            name: first.name,
                            mimeType: first.mimeType,
                          },
                          title: edit.title || first.title,
                        },
                      }));
                    })
                  }
                >
                  Replace photo
                </AppButton>
              </View>
              <View className="flex-1">
                <AppButton
                  size="sm"
                  disabled={!canUpdate}
                  loading={updatingId === att.id}
                  onPress={() => onUpdate(att.id, edit)}
                >
                  Update
                </AppButton>
              </View>
            </View>
            <View className="mt-2">
              <AppButton
                variant="outline"
                size="sm"
                leftIcon="trash-outline"
                loading={deletingId === att.id}
                disabled={deletingId != null && deletingId !== att.id}
                onPress={() => onDelete(att)}
              >
                Delete photo
              </AppButton>
            </View>
          </View>
        );
      })}

      <View className="mt-2 mb-2">
        <AppButton
          variant="outline"
          size="sm"
          leftIcon="attach-outline"
          onPress={() =>
            promptOcpPhotoSource((added) => setDrafts((prev) => [...prev, ...added]))
          }
        >
          Add more photos
        </AppButton>
      </View>

      {drafts.map((photo, index) => (
        <View
          key={photo.key}
          className="mb-4 rounded-xl border border-slate-200 p-3"
        >
          <View className="flex-row items-start justify-between mb-2">
            <Text className="text-sm font-semibold text-textPrimary">
              New photo {index + 1}
            </Text>
          </View>
          <Image
            source={{ uri: photo.uri }}
            className="w-full h-36 rounded-lg mb-3 bg-slate-100"
            resizeMode="cover"
          />
          <View className="mb-3">
            <AppButton
              variant="outline"
              size="sm"
              leftIcon="trash-outline"
              onPress={() =>
                setDrafts((prev) => prev.filter((p) => p.key !== photo.key))
              }
            >
              Remove photo
            </AppButton>
          </View>
          <OcpPhotoMetaFields
            title={photo.title}
            area={photo.area}
            status={photo.status}
            description={photo.description}
            onChangeTitle={(title) => updateDraft(photo.key, { title })}
            onChangeArea={(area) => updateDraft(photo.key, { area })}
            onChangeStatus={(status) => updateDraft(photo.key, { status })}
            onChangeDescription={(description) =>
              updateDraft(photo.key, { description })
            }
          />
        </View>
      ))}

      {drafts.length > 0 ? (
        <AppButton
          loading={adding}
          disabled={!canAddMore}
          onPress={async () => {
            const ok = await onAddMore(drafts);
            if (ok !== false) setDrafts([]);
          }}
        >
          Save new photos
        </AppButton>
      ) : null}

      <View className="mt-5 pt-4 border-t border-slate-200">
        <AppButton
          variant="danger"
          size="sm"
          leftIcon="close-circle-outline"
          onPress={onUncheck}
        >
          Uncheck this night
        </AppButton>
      </View>
    </FormSheetModal>
  );
}
