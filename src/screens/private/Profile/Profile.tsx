import { useLogoutMutation } from "@/src/api/auth.api";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppIcon from "@/src/components/ui/AppIcon";
import Card from "@/src/components/ui/Card";
import { useAuth } from "@/src/providers/AuthProvider";
import { Image, Text, View } from "react-native";

export default function Profile() {
  const { logout, user, selectedBuilding, openBuildingSelectDialog } =
    useAuth();

  const { mutate: mutateLogout, isPending } = useLogoutMutation();

  const handleLogout = () => {
    mutateLogout(undefined, {
      onSuccess: async () => {
        await logout();
      },
    });
  };

  return (
    <View className="flex-1">
      <PageHeader
        icon="person"
        title="Profile"
        subtitle="Manage your account"
      />

      <View className="px-4 gap-6">
        {/*  PROFILE HEADER */}
        <View className="items-center">
          <View className="h-24 w-24 rounded-full bg-primary/20 items-center justify-center">
            {user?.profilePictureUrl ? (
              <Image
                source={{ uri: user.profilePictureUrl }}
                className="h-24 w-24 rounded-full"
              />
            ) : (
              <AppIcon name="person" size={40} color="#453956" />
            )}
          </View>

          <Text className="mt-4 text-lg font-semibold text-textPrimary">
            {user?.fullName || "User"}
          </Text>

          <Text className="text-sm text-textMuted">
            @{user?.username || "username"}
          </Text>

          {/* EDIT PROFILE BUTTON */}
          <AppButton
            variant="outline"
            size="sm"
            className="mt-3"
            // onPress={() => router.push("/(private)/edit-profile")}
            leftIcon="pencil"
          >
            Edit Profile
          </AppButton>
        </View>

        {/* ACCOUNT INFO */}
        <Card className="p-4 gap-4">
          <Text className="text-base font-semibold text-textPrimary">
            Account Information
          </Text>

          <View className="gap-3">
            <View className="flex-row items-center gap-3">
              <AppIcon name="mail" size={18} />
              <Text className="text-sm text-textSecondary">
                {user?.email || "No email"}
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              <AppIcon name="call" size={18} />
              <Text className="text-sm text-textSecondary">
                {user?.phoneNumber || "No phone number"}
              </Text>
            </View>
          </View>
        </Card>

        {/*  BUILDING */}
        <Card className="p-4 gap-4">
          <Text className="text-base font-semibold text-textPrimary">
            Active Building
          </Text>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1">
              <AppIcon name="business" size={18} />

              <Text
                className="text-sm text-textSecondary flex-1"
                numberOfLines={2}
              >
                {selectedBuilding?.label || "No building assigned"}
              </Text>
            </View>

            <AppButton
              variant="secondary"
              size="sm"
              onPress={openBuildingSelectDialog}
            >
              Change
            </AppButton>
          </View>
        </Card>

        {/* ACTIONS */}
        <View className="gap-3">
          {/*  LOGOUT */}
          <AppButton
            // variant="danger"
            loading={isPending}
            onPress={handleLogout}
          >
            Log Out
          </AppButton>
        </View>
      </View>
    </View>
  );
}
