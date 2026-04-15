import React from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";

type ConfirmModalProps = {
  visible: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  visible,
  title = "Are you sure?",
  message = "Please confirm this action.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      {/* Backdrop */}
      <Pressable
        onPress={onCancel}
        className="flex-1 bg-black/50 items-center justify-center px-6"
      >
        {/* Prevent close when pressing inside modal */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full rounded-2xl bg-white p-5"
        >
          <Text className="text-lg font-bold text-textPrimary">{title}</Text>

          <Text className="mt-2 text-sm text-textSecondary">{message}</Text>

          <View className="mt-6 flex-row gap-3">
            <Pressable
              onPress={onCancel}
              disabled={loading}
              className="flex-1 items-center justify-center rounded-xl border border-border py-3"
            >
              <Text className="font-medium text-textPrimary">{cancelText}</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              disabled={loading}
              className={`flex-1 items-center justify-center rounded-xl py-3 ${
                destructive ? "bg-red-500" : "bg-primary"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-medium text-white">{confirmText}</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
