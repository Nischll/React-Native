import { useGetParcelById } from "@/src/api/parcelManagement.api";
import EmptyState from "@/src/components/feedback/EmptyState";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import { formatDateTime } from "@/src/helper/formatDateTime";
import { renderSignature } from "@/src/helper/renderSignature";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import Svg from "react-native-svg";

export default function ParcelDetailsScreen() {
  const { parcelId } = useLocalSearchParams();
  const id = Number(parcelId);

  const { data, isLoading } = useGetParcelById(id);
  const parcel = data?.data;

  if (isLoading) {
    return <LoadingState message="Parcel details loading." />;
  }

  if (!parcel) {
    return <EmptyState message="No Parcel details found." />;
  }

  const isDelivered = parcel.status === "DELIVERED";

  const Field = ({ label, value }: any) => (
    <View className="mb-4 flex-1 px-2">
      <Text className="text-gray-400 text-xs">{label}</Text>
      <Text className="text-gray-900 text-sm font-medium mt-1">
        {value ?? "-"}
      </Text>
    </View>
  );

  const Row = ({ children }: any) => (
    <View className="flex-row">{children}</View>
  );

  return (
    <ScrollView className="flex-1 ">
      {/* Header */}
      <PageHeader
        icon="information-circle"
        title="Parcel Details"
        subtitle={`Tracking: ${parcel.trackingId}`}
        showBackButton
      />

      {/* Status */}
      <View className="mb-4">
        <Text
          className={`font-semibold ${
            isDelivered ? "text-green-600" : "text-blue-500"
          }`}
        >
          {parcel.status}
        </Text>
      </View>

      {/* BASIC INFO */}
      <Row>
        <Field label="Resident Name" value={parcel.residentName} />
        <Field label="Unit" value={parcel.unit} />
      </Row>

      <Row>
        <Field label="Phone" value={parcel.phone} />
        <Field label="Email" value={parcel.recipientEmail} />
      </Row>

      {/* PACKAGE INFO */}
      <Row>
        <Field label="Courier" value={parcel.courier} />
        <Field label="Package Type" value={parcel.packageType} />
      </Row>

      <Row>
        <Field label="Size" value={parcel.size} />
        <Field label="Condition" value={parcel.condition} />
      </Row>

      <Row>
        <Field label="Location" value={parcel.location} />
      </Row>

      {/* TIMELINE */}
      <Row>
        <Field
          label="Received Time"
          value={formatDateTime(parcel.receivedTime)}
        />
        <Field label="Received By" value={parcel.receivedByName} />
      </Row>

      {isDelivered && (
        <Row>
          <Field label="Released By" value={parcel.releasedByName} />
          <Field
            label="Pickup Time"
            value={formatDateTime(parcel.pickupTimestamp)}
          />
        </Row>
      )}

      {/* QR CODE */}
      {/* {parcel.qrCodeUrl && (
        <View className="mt-8 items-center">
          <Text className="text-gray-500 mb-2">QR Code</Text>
          <Image
            source={{ uri: parcel.qrCodeUrl }}
            className="w-40 h-40"
            resizeMode="contain"
          />
        </View>
      )} */}

      {/* SIGNATURE */}
      {parcel.recipientSignature && (
        <View className="mt-8 mb-10">
          <Text className="text-gray-500 mb-2">Signature</Text>

          <View className="bg-gray-100 rounded-md p-2">
            <Svg height={150} width="100%">
              {renderSignature(parcel.recipientSignature)}
            </Svg>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
