import AppInput from "@/src/components/ui/AppInput";
import {
  OCP_AREA_MAX,
  OCP_DESCRIPTION_MAX,
  OCP_TITLE_MAX,
  OcpPhotoStatus,
} from "@/src/types/overnightConciergePatrol.types";
import { Pressable, Text, View } from "react-native";

export function OcpStatusToggle({
  value,
  onChange,
}: {
  value: OcpPhotoStatus;
  onChange: (next: OcpPhotoStatus) => void;
}) {
  return (
    <View className="mt-3">
      <Text className="mb-2 text-base font-semibold text-slate-700">
        Status
      </Text>
      <View className="flex-row rounded-xl border border-slate-300 overflow-hidden">
        <Pressable
          onPress={() => onChange("NORMAL")}
          className={`flex-1 py-2.5 items-center ${
            value === "NORMAL" ? "bg-emerald-500" : "bg-white"
          }`}
        >
          <Text
            className={`text-sm font-semibold ${
              value === "NORMAL" ? "text-white" : "text-slate-600"
            }`}
          >
            Normal
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onChange("NOT_NORMAL")}
          className={`flex-1 py-2.5 items-center ${
            value === "NOT_NORMAL" ? "bg-amber-500" : "bg-white"
          }`}
        >
          <Text
            className={`text-sm font-semibold ${
              value === "NOT_NORMAL" ? "text-white" : "text-slate-600"
            }`}
          >
            Not normal
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function OcpPhotoMetaFields({
  title,
  area,
  status,
  description,
  onChangeTitle,
  onChangeArea,
  onChangeStatus,
  onChangeDescription,
}: {
  title: string;
  area: string;
  status: OcpPhotoStatus;
  description: string;
  onChangeTitle: (v: string) => void;
  onChangeArea: (v: string) => void;
  onChangeStatus: (v: OcpPhotoStatus) => void;
  onChangeDescription: (v: string) => void;
}) {
  return (
    <View>
      <AppInput
        label="Title"
        value={title}
        onChangeText={onChangeTitle}
        placeholder="Photo title"
        maxLength={OCP_TITLE_MAX}
      />
      <View className="mt-3">
        <AppInput
          label="Area"
          value={area}
          onChangeText={onChangeArea}
          placeholder="e.g. Main lobby"
          maxLength={OCP_AREA_MAX}
        />
      </View>
      <OcpStatusToggle value={status} onChange={onChangeStatus} />
      <View className="mt-3">
        <AppInput
          label="Description (optional)"
          value={description}
          onChangeText={onChangeDescription}
          placeholder="Notes"
          maxLength={OCP_DESCRIPTION_MAX}
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );
}

export function OcpStatusBadge({ status }: { status?: string | null }) {
  const notNormal = String(status ?? "").toUpperCase() === "NOT_NORMAL";
  return (
    <View
      className={`px-2 py-0.5 rounded-full ${
        notNormal ? "bg-amber-100" : "bg-emerald-100"
      }`}
    >
      <Text
        className={`text-[10px] font-semibold ${
          notNormal ? "text-amber-800" : "text-emerald-800"
        }`}
      >
        {notNormal ? "Not normal" : "Normal"}
      </Text>
    </View>
  );
}
