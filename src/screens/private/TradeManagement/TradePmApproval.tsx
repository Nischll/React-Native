import * as DocumentPicker from "expo-document-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  useGetTradeVisitById,
  useUpdateTradeVisitPmApproval,
} from "@/src/api/tradeManagement.api";
import EmptyState from "@/src/components/feedback/EmptyState";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppIcon from "@/src/components/ui/AppIcon";
import Card from "@/src/components/ui/Card";
import ConfirmModal from "@/src/components/ui/ConfirmModal";

export default function TradePmApproval() {
  const { id } = useLocalSearchParams();
  const idNum = Number(id);

  const { data, isLoading, refetch } = useGetTradeVisitById(idNum);
  const trade = data?.data;

  const pmMutation = useUpdateTradeVisitPmApproval(idNum);

  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    mimeType?: string;
    size?: number;
  } | null>(null);

  const [showRevokeModal, setShowRevokeModal] = useState(false);

  const isApproved = trade?.pmApproved === true;

  // ---------------- FILE PICKER ----------------
  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType,
          size: asset.size,
        });
      }
    } catch (err) {
      Alert.alert("Error", "Failed to pick file.");
    }
  };

  // ---------------- SUBMIT / REPLACE ----------------
  const handleSubmit = () => {
    if (!selectedFile) {
      Alert.alert("Required", "Please select a document or image.");
      return;
    }

    const formData = new FormData();
    formData.append("approved", "true");
    formData.append("file", {
      uri:
        Platform.OS === "ios"
          ? selectedFile.uri.replace("file://", "")
          : selectedFile.uri,
      name: selectedFile.name,
      type: selectedFile.mimeType ?? "application/octet-stream",
    } as any);

    pmMutation.mutate(formData as any, {
      onSuccess: () => {
        refetch();
        setSelectedFile(null);
        router.back();
      },
    });
  };

  // ---------------- REVOKE ----------------
  const handleRevokeConfirm = () => {
    const formData = new FormData();
    formData.append("approved", "false");

    pmMutation.mutate(formData as any, {
      onSuccess: () => {
        setShowRevokeModal(false);
        refetch();
        router.back();
      },
    });
  };

  // ---------------- LOADING ----------------
  if (isLoading) {
    return <LoadingState />;
  }

  if (!trade) {
    return <EmptyState title="Trade Visit" message="Not trade visit found." />;
  }

  return (
    <View className="flex-1">
      <PageHeader
        title="PM Approval"
        subtitle={
          isApproved ? "Manage approval document" : "Submit for approval"
        }
        icon="document-text"
        showBackButton
      />

      <ScrollView className="">
        {/* ---------------- STATUS BANNER ---------------- */}
        <View
          className={`flex-row items-center p-3 rounded-xl mb-4 ${
            isApproved ? "bg-green-50" : "bg-amber-50"
          }`}
        >
          <AppIcon
            name={isApproved ? "checkmark-circle" : "time"}
            size={20}
            color={isApproved ? "#16a34a" : "#d97706"}
          />
          <Text
            className={`ml-2 font-semibold ${
              isApproved ? "text-green-700" : "text-amber-700"
            }`}
          >
            {isApproved ? "PM Approved" : "Awaiting PM Approval"}
          </Text>
        </View>

        {/* ---------------- TRADE INFO ---------------- */}
        <Card className="p-4 mb-4">
          <Text className="font-semibold text-base">{trade.tradeName}</Text>
          {trade.company ? (
            <Text className="text-gray-500 mt-0.5">{trade.company}</Text>
          ) : null}
          {trade.buildingName ? (
            <Text className="text-gray-400 text-xs mt-0.5">
              {trade.buildingName}
            </Text>
          ) : null}
        </Card>

        {/* ---------------- CURRENT DOCUMENT (if approved) ---------------- */}
        {isApproved && trade.pmApprovalAttachment && (
          <Card className="p-4 mb-4">
            <Text className="font-semibold mb-2">Current Document</Text>
            <View className="flex-row items-center bg-gray-100 rounded-lg p-3">
              <AppIcon name="document" size={20} color="#6b7280" />
              <Text
                className="flex-1 ml-2 text-gray-700 font-medium"
                numberOfLines={2}
                ellipsizeMode="middle"
              >
                {trade.pmApprovalAttachment.originalFileName}
              </Text>
            </View>
          </Card>
        )}

        {/* ---------------- UPLOAD SECTION ---------------- */}
        <Card className="p-4 mb-4">
          <Text className="font-semibold mb-3">
            {isApproved ? "Replace Document" : "Upload Approval Document"}
          </Text>

          <Text className="text-gray-500 text-xs mb-3">
            Accepted formats: PDF, JPG, PNG
          </Text>

          <TouchableOpacity
            onPress={handlePickFile}
            className="border-2 border-dashed border-gray-300 rounded-xl p-5 items-center justify-center"
            activeOpacity={0.7}
          >
            {selectedFile ? (
              <View className="items-center w-full">
                <AppIcon name="document-attach" size={28} color="#2563eb" />
                <Text
                  className="text-blue-600 font-medium mt-2 text-center"
                  numberOfLines={2}
                >
                  {selectedFile.name}
                </Text>
                {selectedFile.size && (
                  <Text className="text-gray-400 text-xs mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </Text>
                )}
                <Text className="text-gray-400 text-xs mt-2">
                  Tap to change
                </Text>
              </View>
            ) : (
              <View className="items-center">
                <AppIcon
                  name="cloud-upload-outline"
                  size={32}
                  color="#9ca3af"
                />
                <Text className="text-gray-500 font-medium mt-2">
                  Tap to select file
                </Text>
                <Text className="text-gray-400 text-xs mt-1">PDF or Image</Text>
              </View>
            )}
          </TouchableOpacity>
        </Card>

        {/* ---------------- SUBMIT BUTTON ---------------- */}
        <AppButton
          onPress={handleSubmit}
          loading={pmMutation.isPending}
          disabled={!selectedFile}
        >
          {isApproved ? "Replace Document" : "Submit for PM Approval"}
        </AppButton>

        {/* ---------------- REVOKE BUTTON (only when approved) ---------------- */}
        {isApproved && (
          <TouchableOpacity
            onPress={() => setShowRevokeModal(true)}
            disabled={pmMutation.isPending}
            className="mt-3 mb-8 border border-red-400 rounded-xl py-3 items-center"
            activeOpacity={0.7}
          >
            <Text className="text-red-500 font-semibold">Revoke Approval</Text>
          </TouchableOpacity>
        )}

        <View className="h-8" />
      </ScrollView>

      {/* ---------------- REVOKE CONFIRM MODAL ---------------- */}
      <ConfirmModal
        visible={showRevokeModal}
        title="Revoke Approval"
        message="Are you sure you want to revoke PM approval? This will mark the visit as unapproved."
        confirmText="Revoke"
        destructive
        loading={pmMutation.isPending}
        onConfirm={handleRevokeConfirm}
        onCancel={() => setShowRevokeModal(false)}
      />
    </View>
  );
}
