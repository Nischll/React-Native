import FormSheetModal from "@/src/components/domain/FormSheetModal";
import EmptyState from "@/src/components/feedback/EmptyState";
import ListPager from "@/src/components/layout/ListPager";
import AppIcon from "@/src/components/ui/AppIcon";
import AppInput from "@/src/components/ui/AppInput";
import { PrivateUserOption } from "@/src/types/privateMessage.types";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

export default function UserPickerSheet({
  visible,
  search,
  users,
  loading,
  page,
  pageSize,
  total,
  onChangeSearch,
  onPageChange,
  onClose,
  onSelect,
}: {
  visible: boolean;
  search: string;
  users: PrivateUserOption[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onChangeSearch: (value: string) => void;
  onPageChange: (page: number) => void;
  onClose: () => void;
  onSelect: (user: PrivateUserOption) => void;
}) {
  return (
    <FormSheetModal
      visible={visible}
      title="New message"
      subtitle="Pick someone who is not already in your inbox."
      hideSubmit
      onClose={onClose}
    >
      <AppInput
        placeholder="Search users"
        value={search}
        onChangeText={onChangeSearch}
        leftIcon="search-outline"
        size="sm"
      />
      <View className="mt-3 min-h-[180px]">
        {loading ? (
          <ActivityIndicator className="mt-8" color="#453956" />
        ) : users.length === 0 ? (
          <EmptyState message="No people found." />
        ) : (
          <View>
            {users.map((person) => (
              <Pressable
                key={person.userId}
                onPress={() => onSelect(person)}
                className="flex-row items-center py-3 border-b border-slate-100"
              >
                <View className="h-9 w-9 rounded-full bg-primary/10 items-center justify-center mr-3">
                  <AppIcon name="person-outline" size={16} color="#453956" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-textPrimary">
                    {person.fullName}
                  </Text>
                  {person.email ? (
                    <Text className="text-xs text-textSecondary">
                      {person.email}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
            <ListPager
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={onPageChange}
            />
          </View>
        )}
      </View>
    </FormSheetModal>
  );
}
