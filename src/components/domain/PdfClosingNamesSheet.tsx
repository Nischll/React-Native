import FormSheetModal from "@/src/components/domain/FormSheetModal";
import AppInput from "@/src/components/ui/AppInput";
import { Text, View } from "react-native";

export type PdfClosingNameField<K extends string> = {
  key: K;
  label: string;
  placeholder?: string;
};

export default function PdfClosingNamesSheet<K extends string>({
  visible,
  title,
  subtitle,
  hint,
  fields,
  value,
  onChange,
  submitLabel,
  loading,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  hint?: string;
  fields: PdfClosingNameField<K>[];
  value: Record<K, string>;
  onChange: (next: Record<K, string>) => void;
  submitLabel: string;
  loading?: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <FormSheetModal
      visible={visible}
      title={title}
      subtitle={subtitle}
      submitLabel={submitLabel}
      loading={loading}
      onClose={onClose}
      onSubmit={onSubmit}
    >
      {hint ? (
        <Text className="text-sm text-textSecondary mb-4">{hint}</Text>
      ) : null}
      {fields.map((field, index) => (
        <View key={field.key} className={index === 0 ? "" : "mt-3"}>
          <AppInput
            label={field.label}
            value={value[field.key] ?? ""}
            onChangeText={(text) =>
              onChange({ ...value, [field.key]: text })
            }
            placeholder={field.placeholder}
          />
        </View>
      ))}
    </FormSheetModal>
  );
}
