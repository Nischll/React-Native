import FormSheetModal from "@/src/components/domain/FormSheetModal";
import AppButton from "@/src/components/ui/AppButton";
import AppIcon from "@/src/components/ui/AppIcon";
import {
  draftsAreComplete,
  promptOcpPhotoSource,
} from "@/src/helper/ocpMedia";
import {
  OcpDraftPhoto,
  OcpPhotoStatus,
} from "@/src/types/overnightConciergePatrol.types";
import { Image, Pressable, Text, View } from "react-native";
import { useState } from "react";
import { OcpPhotoMetaFields } from "./OcpPhotoFields";
import PhotoPreviewModal from "./PhotoPreviewModal";

export default function CompleteTaskSheet({
  visible,
  dutyTitle,
  loading,
  photos,
  onChangePhotos,
  onClose,
  onSave,
}: {
  visible: boolean;
  dutyTitle: string;
  loading: boolean;
  photos: OcpDraftPhoto[];
  onChangePhotos: (photos: OcpDraftPhoto[]) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const canSave = draftsAreComplete(photos);
  const [preview, setPreview] = useState<OcpDraftPhoto | null>(null);

  const updatePhoto = (key: string, patch: Partial<OcpDraftPhoto>) => {
    onChangePhotos(
      photos.map((p) => (p.key === key ? { ...p, ...patch } : p)),
    );
  };

  return (
    <>
    <FormSheetModal
      visible={visible}
      title="Complete patrol duty"
      subtitle={dutyTitle}
      submitLabel="Save"
      loading={loading}
      submitDisabled={!canSave}
      onClose={onClose}
      onSubmit={onSave}
    >
      <Text className="text-sm text-textSecondary mb-3">
        Add at least one photo. Title and area are required for each photo
        before you can save.
      </Text>

      <View className="flex-row gap-2 mb-4">
        <View className="flex-1">
          <AppButton
            variant="outline"
            size="sm"
            leftIcon="camera-outline"
            onPress={() =>
              promptOcpPhotoSource((added) =>
                onChangePhotos([...photos, ...added]),
              )
            }
          >
            Add photos
          </AppButton>
        </View>
      </View>

      {photos.length === 0 ? (
        <View className="items-center py-6 rounded-xl bg-slate-50 border border-dashed border-slate-200">
          <AppIcon name="camera-outline" size={28} color="#94A3B8" />
          <Text className="text-sm text-slate-500 mt-2">No photos yet</Text>
        </View>
      ) : (
        photos.map((photo, index) => (
          <View
            key={photo.key}
            className="mb-4 rounded-xl border border-slate-200 p-3"
          >
            <View className="flex-row items-start justify-between mb-2">
              <Text className="text-sm font-semibold text-textPrimary">
                Photo {index + 1}
              </Text>
              <Pressable
                onPress={() =>
                  onChangePhotos(photos.filter((p) => p.key !== photo.key))
                }
                className="h-8 w-8 items-center justify-center rounded-full bg-red-50"
              >
                <AppIcon name="trash-outline" size={16} color="#ef4444" />
              </Pressable>
            </View>
            <Pressable onPress={() => setPreview(photo)}>
              <Image
                source={{ uri: photo.uri }}
                className="w-full h-36 rounded-lg mb-3 bg-slate-100"
                resizeMode="cover"
              />
            </Pressable>
            <OcpPhotoMetaFields
              title={photo.title}
              area={photo.area}
              status={photo.status}
              description={photo.description}
              onChangeTitle={(title) => updatePhoto(photo.key, { title })}
              onChangeArea={(area) => updatePhoto(photo.key, { area })}
              onChangeStatus={(status: OcpPhotoStatus) =>
                updatePhoto(photo.key, { status })
              }
              onChangeDescription={(description) =>
                updatePhoto(photo.key, { description })
              }
            />
          </View>
        ))
      )}
    </FormSheetModal>
    <PhotoPreviewModal
      attachment={
        preview
          ? {
              id: 0,
              title: preview.title,
              area: preview.area,
              status: preview.status,
              description: preview.description,
            }
          : null
      }
      localUri={preview?.uri}
      onClose={() => setPreview(null)}
    />
    </>
  );
}
