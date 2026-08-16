import AppIcon from "@/src/components/ui/AppIcon";
import { OcpAttachment } from "@/src/types/overnightConciergePatrol.types";
import { Image, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OcpStatusBadge } from "./OcpPhotoFields";
import OcpRemoteImage from "./OcpRemoteImage";

export default function PhotoPreviewModal({
  attachment,
  localUri,
  onClose,
}: {
  attachment: OcpAttachment | null;
  localUri?: string | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const visible = !!attachment || !!localUri;
  const title = attachment?.title || attachment?.originalFileName || "Photo";
  const area = attachment?.area;
  const description = attachment?.description;
  const status = attachment?.status;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black">
        <Pressable
          onPress={onClose}
          className="absolute z-10 h-10 w-10 items-center justify-center rounded-full bg-white/20"
          style={{ top: insets.top + 8, right: 16 }}
        >
          <AppIcon name="close" size={22} color="#fff" />
        </Pressable>

        <View className="flex-1 items-center justify-center px-2">
          {localUri ? (
            <Image
              source={{ uri: localUri }}
              style={{ width: "100%", height: "70%" }}
              resizeMode="contain"
            />
          ) : (
            <OcpRemoteImage
              fileUrl={attachment?.fileUrl}
              style={{ width: "100%", height: "70%" }}
              resizeMode="contain"
            />
          )}
        </View>

        <View
          className="px-5 pb-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-white text-base font-bold flex-1" numberOfLines={2}>
              {title}
            </Text>
            {status ? <OcpStatusBadge status={status} /> : null}
          </View>
          {area ? (
            <Text className="text-white/80 text-sm">{area}</Text>
          ) : null}
          {description ? (
            <Text className="text-white/70 text-sm mt-1">{description}</Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
