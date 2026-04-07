import { Text, View } from "react-native";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <View className="mb-6">
      <Text className="text-3xl font-bold text-slate-900">{title}</Text>
      {subtitle ? (
        <Text className="mt-2 text-base text-slate-500">{subtitle}</Text>
      ) : null}
    </View>
  );
}
