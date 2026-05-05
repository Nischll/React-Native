import { useLogoutMutation } from "@/src/api/auth.api";
import { useUpdateProfile } from "@/src/api/profile.api";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppIcon from "@/src/components/ui/AppIcon";
import AppInput from "@/src/components/ui/AppInput";
import Card from "@/src/components/ui/Card";
import { CollapsibleCard } from "@/src/components/ui/CollapsibleCard";
import { BASE_URL } from "@/src/constants/env";
import { AvatarPicker } from "@/src/helper/AvatarPicker";
import { useAuth } from "@/src/providers/AuthProvider";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Platform, Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileFormValues {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  phoneNumber: string;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveProfilePicture(
  profilePictureUrl?: string | null,
  profilePicturePath?: string | null,
): string | null {
  const baseUrl = (BASE_URL ?? "").replace(/\/$/, "").replace(/\/api$/, "");
  if (profilePictureUrl) {
    const fileName = profilePictureUrl.split("/").pop() || profilePictureUrl;
    return `${baseUrl}/api/auth/profile-picture/${fileName}`;
  }
  if (profilePicturePath) {
    const fileName = profilePicturePath.split("/").pop() || profilePicturePath;
    return `${baseUrl}/api/auth/profile-picture/${fileName}`;
  }
  return null;
}

// ─── Field Row ────────────────────────────────────────────────────────────────

function FieldRow({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: "#6B7280",
          marginBottom: 5,
        }}
      >
        {label}
      </Text>
      {children}
      {error && (
        <Text style={{ fontSize: 11, color: "#EF4444", marginTop: 3 }}>
          {error}
        </Text>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function Profile() {
  const {
    user,
    logout,
    selectedBuilding,
    openBuildingSelectDialog,
    refetchInitData,
  } = useAuth();

  const { mutate: updateProfile, isPending: updating } = useUpdateProfile();
  const { mutate: mutateLogout, isPending } = useLogoutMutation();

  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [localAvatarName, setLocalAvatarName] = useState("avatar.jpg");
  const [localAvatarMime, setLocalAvatarMime] = useState("image/jpeg");
  const [avatarSaving, setAvatarSaving] = useState(false);

  const [showPersonal, setShowPersonal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogout = () => {
    mutateLogout(undefined, {
      onSuccess: async () => {
        await logout();
      },
    });
  };

  // ── Profile form ─────────────────────────────────────────────────────────

  const profileForm = useForm<ProfileFormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      middleName: "",
      email: "",
      phoneNumber: "",
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        middleName: user.middleName ?? "",
        email: user.email ?? "",
        phoneNumber: user.phoneNumber ?? "",
      });
    }
  }, [user]);

  // ── Password form ─────────────────────────────────────────────────────────

  const passwordForm = useForm<PasswordFormValues>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  // ── Save avatar only — sends existing user fields + new picture ───────────

  const handleSaveAvatar = () => {
    if (!localAvatarUri || !user) return;
    setAvatarSaving(true);

    const form = new FormData();
    form.append("firstName", user.firstName ?? "");
    form.append("lastName", user.lastName ?? "");
    if (user.middleName) form.append("middleName", user.middleName);
    form.append("email", user.email ?? "");
    if (user.phoneNumber) form.append("phoneNumber", user.phoneNumber);
    form.append("username", user.username ?? "");
    form.append("profilePicture", {
      uri:
        Platform.OS === "android"
          ? localAvatarUri
          : localAvatarUri.replace("file://", ""),
      name: localAvatarName,
      type: localAvatarMime,
    } as any);

    updateProfile(form as any, {
      onSuccess: () => {
        setAvatarSaving(false);
        setLocalAvatarUri(null); // clear pending state
        refetchInitData();
      },
      onError: () => {
        setAvatarSaving(false);
      },
    });
  };

  // ── Submit: profile fields ────────────────────────────────────────────────

  const onSubmitProfile = (values: ProfileFormValues) => {
    // If there's also a pending avatar, bundle it together
    if (localAvatarUri) {
      const form = new FormData();
      form.append("firstName", values.firstName);
      form.append("lastName", values.lastName);
      if (values.middleName) form.append("middleName", values.middleName);
      form.append("email", values.email);
      if (values.phoneNumber) form.append("phoneNumber", values.phoneNumber);
      form.append("username", user?.username ?? "");
      form.append("profilePicture", {
        uri:
          Platform.OS === "android"
            ? localAvatarUri
            : localAvatarUri.replace("file://", ""),
        name: localAvatarName,
        type: localAvatarMime,
      } as any);
      updateProfile(form as any, {
        onSuccess: () => {
          setLocalAvatarUri(null);
          refetchInitData();
        },
      });
    } else {
      updateProfile(
        {
          firstName: values.firstName,
          lastName: values.lastName,
          middleName: values.middleName || undefined,
          email: values.email,
          phoneNumber: values.phoneNumber || undefined,
          username: user?.username ?? "",
        } as any,
        { onSuccess: () => refetchInitData() },
      );
    }
  };

  // ── Submit: password ──────────────────────────────────────────────────────

  const onSubmitPassword = (values: PasswordFormValues) => {
    if (!values.currentPassword.trim()) {
      passwordForm.setError("currentPassword", {
        message: "Current password is required",
      });
      return;
    }
    if (values.newPassword.length < 6) {
      passwordForm.setError("newPassword", {
        message: "Must be at least 6 characters",
      });
      return;
    }
    if (values.newPassword !== values.confirmNewPassword) {
      passwordForm.setError("confirmNewPassword", {
        message: "Passwords do not match",
      });
      return;
    }

    updateProfile(
      {
        firstName: user?.firstName ?? "",
        lastName: user?.lastName ?? "",
        email: user?.email ?? "",
        username: user?.username ?? "",
        currentPassword: values.currentPassword.trim(),
        newPassword: values.newPassword.trim(),
      } as any,
      {
        onSuccess: () => {
          Alert.alert("Success", "Password changed.");
          passwordForm.reset();
          setShowPassword(false);
        },
      },
    );
  };

  const remoteAvatarUri = resolveProfilePicture(
    (user as any)?.profilePictureUrl,
    (user as any)?.profilePicturePath,
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1 }}>
      <PageHeader
        icon="person"
        title="Profile"
        subtitle="Manage your account"
      />

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 6, paddingBottom: 48 }}
        enableOnAndroid
        extraScrollHeight={100}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar ── */}
        <AvatarPicker
          initials={user}
          remoteUri={remoteAvatarUri}
          localUri={localAvatarUri}
          saving={avatarSaving}
          onPick={(uri, name, mime) => {
            setLocalAvatarUri(uri);
            setLocalAvatarName(name);
            setLocalAvatarMime(mime);
          }}
          onSave={handleSaveAvatar}
          onCancel={() => setLocalAvatarUri(null)}
        />

        <View className="mb-4 border-b border-slate-300 border-opacity-50" />

        {/* ── Active Building ── */}
        {user?.buildingList && (user.buildingList as any[]).length > 0 && (
          <Card className="px-4 py-3 mb-4">
            <Pressable
              onPress={openBuildingSelectDialog}
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  backgroundColor: "#EEF2FF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppIcon name="business" size={16} color="#4F46E5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 13, fontWeight: "600", color: "#374151" }}
                >
                  {selectedBuilding?.label || "No building assigned"}
                </Text>
                <Text style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>
                  Active building · tap to switch
                </Text>
              </View>
              <AppIcon name="chevron-forward" size={15} color="#9CA3AF" />
            </Pressable>
          </Card>
        )}

        {/* ── Personal Information ── */}
        <CollapsibleCard
          icon="person-outline"
          title="Personal Information"
          subtitle="Name, email, phone"
          expanded={showPersonal}
          onToggle={() => setShowPersonal((v) => !v)}
          accentColor="#4F46E5"
        >
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Controller
                control={profileForm.control}
                name="firstName"
                rules={{ required: "Required" }}
                render={({
                  field: { onChange, value },
                  fieldState: { error },
                }) => (
                  <FieldRow label="First Name" error={error?.message}>
                    <AppInput
                      value={value}
                      onChangeText={onChange}
                      placeholder="First name"
                      size="sm"
                    />
                  </FieldRow>
                )}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={profileForm.control}
                name="middleName"
                render={({ field: { onChange, value } }) => (
                  <FieldRow label="Middle Name">
                    <AppInput
                      value={value}
                      onChangeText={onChange}
                      placeholder="Optional"
                      size="sm"
                    />
                  </FieldRow>
                )}
              />
            </View>
          </View>

          <Controller
            control={profileForm.control}
            name="lastName"
            rules={{ required: "Required" }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FieldRow label="Last Name" error={error?.message}>
                <AppInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Last name"
                  size="sm"
                />
              </FieldRow>
            )}
          />

          <Controller
            control={profileForm.control}
            name="email"
            rules={{ required: "Required" }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FieldRow label="Email" error={error?.message}>
                <AppInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Email address"
                  size="sm"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </FieldRow>
            )}
          />

          <Controller
            control={profileForm.control}
            name="phoneNumber"
            render={({ field: { onChange, value } }) => (
              <FieldRow label="Phone Number">
                <AppInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Phone number (optional)"
                  size="sm"
                  keyboardType="phone-pad"
                />
              </FieldRow>
            )}
          />

          <View style={{ paddingBottom: 4 }}>
            <AppButton
              loading={updating}
              onPress={profileForm.handleSubmit(onSubmitProfile)}
            >
              Save Changes
            </AppButton>
          </View>
        </CollapsibleCard>

        {/* ── Change Password ── */}
        <CollapsibleCard
          icon="lock-closed-outline"
          title="Change Password"
          subtitle="Update your password"
          expanded={showPassword}
          onToggle={() => setShowPassword((v) => !v)}
          accentColor="#7C3AED"
        >
          <Controller
            control={passwordForm.control}
            name="currentPassword"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FieldRow label="Current Password" error={error?.message}>
                <AppInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter current password"
                  size="sm"
                  secureTextEntry
                />
              </FieldRow>
            )}
          />

          <Controller
            control={passwordForm.control}
            name="newPassword"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FieldRow label="New Password" error={error?.message}>
                <AppInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Min. 6 characters"
                  size="sm"
                  secureTextEntry
                />
              </FieldRow>
            )}
          />

          <Controller
            control={passwordForm.control}
            name="confirmNewPassword"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FieldRow label="Confirm New Password" error={error?.message}>
                <AppInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Re-enter new password"
                  size="sm"
                  secureTextEntry
                />
              </FieldRow>
            )}
          />

          <View style={{ paddingBottom: 4 }}>
            <AppButton
              loading={updating}
              onPress={passwordForm.handleSubmit(onSubmitPassword)}
            >
              Update Password
            </AppButton>
          </View>
        </CollapsibleCard>
      </KeyboardAwareScrollView>
      <View className="py-4 border-t border-gray-200 bg-white">
        <AppButton
          variant="outline"
          loading={isPending}
          onPress={handleLogout}
          leftIcon="log-out-outline"
        >
          Log Out
        </AppButton>
      </View>
    </View>
  );
}
