import { useDeleteAtachment } from "@/src/api/taskManagement.api";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

export interface ExistingAttachment {
  id: number;
  taskId: number;
  title: string;
}

interface AttachmentManagerProps {
  attachments: ExistingAttachment[];
  taskId: number;
  onDeleted: (deletedId: number) => void;
}

function AttachmentRow({
  attachment,
  onDeleted,
  onDeleteSuccess,
}: {
  attachment: ExistingAttachment;
  onDeleted: (id: number) => void;
  onDeleteSuccess: () => void;
}) {
  const [confirmVisible, setConfirmVisible] = useState(false);
  const { mutate: deleteAttachment, isPending } = useDeleteAtachment(
    attachment.id,
  );

  function handleConfirm() {
    deleteAttachment(undefined, {
      onSuccess: () => {
        setConfirmVisible(false);
        onDeleteSuccess();
        onDeleted(attachment.id);
      },
    });
  }

  return (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#E5E7EB",
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
          <Ionicons name="document-text-outline" size={20} color="#6B7280" />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{ fontSize: 13, fontWeight: "600", color: "#111827" }}
            numberOfLines={1}
          >
            {attachment.title}
          </Text>
          <Text style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>
            Existing attachment
          </Text>
        </View>

        {isPending ? (
          <ActivityIndicator size="small" color="#EF4444" />
        ) : (
          <TouchableOpacity onPress={() => setConfirmVisible(true)} hitSlop={8}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      <ConfirmModal
        visible={confirmVisible}
        title="Delete Attachment"
        message={`Remove "${attachment.title}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive
        loading={isPending}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmVisible(false)}
      />
    </>
  );
}

export default function AttachmentManager({
  attachments,
  taskId,
  onDeleted,
}: AttachmentManagerProps) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(attachments);

  function bustTaskCache() {
    queryClient.invalidateQueries({
      predicate: (query) =>
        String(query.queryKey[0]).includes(`/task/${taskId}`),
    });
  }

  function handleDeleted(id: number) {
    setVisible((prev) => prev.filter((a) => a.id !== id));
    onDeleted(id);
  }

  if (visible.length === 0) return null;

  return (
    <View style={{ marginTop: 4 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: "#374151",
          marginBottom: 8,
        }}
      >
        Existing Attachments
      </Text>
      {visible.map((att) => (
        <AttachmentRow
          key={att.id}
          attachment={att}
          onDeleted={handleDeleted}
          onDeleteSuccess={bustTaskCache}
        />
      ))}
    </View>
  );
}
