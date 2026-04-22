import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import {
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg from "react-native-svg";

import { useGetTradeVisits } from "@/src/api/tradeManagement.api";
import PageHeader from "@/src/components/layout/PageHeader";
import Card from "@/src/components/ui/Card";
import { formatDateTime } from "@/src/helper/formatDateTime";
import { renderSignature } from "@/src/helper/renderSignature";
import { useAuth } from "@/src/providers/AuthProvider";
import { TradeVisitResponse } from "@/src/types/tradeManagement.types";

export default function TradeDetails() {
  const { id } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const { buildingId } = useAuth();

  const idNum = Number(id);

  if (!id || isNaN(idNum)) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Invalid trade ID</Text>
      </View>
    );
  }

  // ---------------- CACHE FIRST ----------------
  const cachedQueries = queryClient.getQueriesData({
    queryKey: ["trade-visit"],
  });

  const cachedTrades: TradeVisitResponse[] = cachedQueries
    .map(([, data]: any) => data?.data?.data ?? [])
    .flat();

  let trade = cachedTrades.find((t) => t.id === idNum);

  // ---------------- FALLBACK FETCH ----------------
  const { data: fallbackData, isLoading } = useGetTradeVisits(
    {
      page: 1,
      limit: 20,
      buildingId: buildingId ?? undefined,
    },
    !!buildingId && !trade,
  );

  const fallbackTrades = fallbackData?.data?.data ?? [];

  if (!trade) {
    trade = fallbackTrades.find((t) => t.id === idNum);
  }

  if (!trade && isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading trade details...</Text>
      </View>
    );
  }

  if (!trade) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Trade not found</Text>
      </View>
    );
  }

  // ---------------- HELPERS ----------------
  const formatEnum = (value?: string | null) =>
    value
      ? value
          .replaceAll("_", " ")
          .toLowerCase()
          .replace(/\b\w/g, (l) => l.toUpperCase())
      : "-";

  const badge =
    "px-3 py-1 rounded-full text-xs bg-gray-200 text-gray-700 mr-2 mb-2";

  return (
    <View className="flex-1">
      <PageHeader
        title="Trade Details"
        subtitle="Visit overview & activity"
        icon="construct"
        showBackButton
      />

      <ScrollView className="p-2">
        {/* ---------------- HEADER ---------------- */}
        <Card className="p-4 mb-4">
          <Text className="text-xl font-bold">{trade.tradeName}</Text>

          <Text className="text-gray-500 mt-1">{trade.company || "-"}</Text>

          <Text className="text-gray-500">{trade.buildingName || "-"}</Text>

          <Text className="text-gray-500 mt-2">
            {formatDateTime(trade.scheduledAppointmentAt)}
          </Text>

          <View className="flex-row flex-wrap mt-3">
            <Text className={badge}>{formatEnum(trade.lifecycleStatus)}</Text>
            <Text className={badge}>{formatEnum(trade.entryType)}</Text>
            <Text className={badge}>{formatEnum(trade.workType)}</Text>
          </View>
        </Card>

        {/* ---------------- VISIT SUMMARY ---------------- */}
        <Card className="p-4 mb-4">
          <Text className="font-semibold mb-2">Visit Summary</Text>

          <Info label="Reason" value={trade.reasonForVisit} />
          <Info label="Location" value={trade.location} />
          <Info label="Unit" value={trade.residentUnit} />
          <Info label="Work Order" value={trade.workOrderNumber} />
        </Card>

        {/* ---------------- CONTACT ---------------- */}
        <Card className="p-4 mb-4">
          <Text className="font-semibold mb-2">Contact & Notifications</Text>

          <Info label="Phone" value={trade.phoneNumber} />
          <Info label="Verified" value={trade.phoneVerified ? "Yes" : "No"} />
          <Info label="SMS Sent" value={trade.bookingSmsSent ? "Yes" : "No"} />
        </Card>

        {/* ---------------- PM APPROVAL ---------------- */}
        <Card className="p-4 mb-4">
          <Text className="font-semibold mb-2">PM Approval</Text>

          <Info
            label="Status"
            value={trade.pmApproved ? "Approved" : "Pending"}
          />

          {trade.pmApprovalAttachment ? (
            <View className="flex-row justify-between mt-2">
              <Text className="text-gray-500">Document</Text>

              <TouchableOpacity
                onPress={() =>
                  Linking.openURL(
                    `https://cloud.bildstrata.com/api/trade-visit/${id}/pm-approval-attachment}`,
                  )
                }
                className="flex-1 ml-4"
              >
                <Text
                  className="text-blue-600 font-medium"
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {trade.pmApprovalAttachment.originalFileName}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Info label="Document" value="-" />
          )}
        </Card>

        {/* ---------------- SITE ACCESS ---------------- */}
        <Card className="p-4 mb-4">
          <Text className="font-semibold mb-2">Site Access</Text>
          <Info label="Key / Fob" value={trade.fobOrKeyAssigned} />
          <Info
            label="Key Status"
            value={formatEnum(trade.keyFobStatus ?? undefined)}
          />
        </Card>

        {/* ---------------- CHECK-IN / OUT ---------------- */}
        <Card className="p-4 mb-4">
          <Text className="font-semibold mb-2">Check-in & Checkout</Text>

          <Info label="Time In" value={formatDateTime(trade.timeIn)} />
          <Info label="Time Out" value={formatDateTime(trade.timeOut)} />
          <Info
            label="Total Time"
            value={
              trade.totalMinutesSpent != null
                ? `${trade.totalMinutesSpent} mins`
                : "-"
            }
          />
        </Card>

        {/* ---------------- SIGNATURE ---------------- */}
        {trade.signatureData && (
          <Card className="p-4 mb-6">
            <Text className="font-semibold mb-2">Signature</Text>

            <View className="bg-gray-100 rounded-md p-2">
              <Svg height={160} width="100%">
                {renderSignature(trade.signatureData)}
              </Svg>
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

/* ---------------- REUSABLE INFO ROW ---------------- */
function Info({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <View className="flex-row justify-between mb-1">
      <Text className="text-gray-500 w-1/3">{label}</Text>

      <Text
        className="flex-1 text-right font-medium"
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {value && String(value).trim() !== "" ? value : "-"}
      </Text>
    </View>
  );
}
