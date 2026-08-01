import { useAddRole, useUpdateRole } from "@/src/api/role.api";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import { RoleResponse } from "@/src/types/role.types";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, TouchableWithoutFeedback, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

interface FormValues {
  name: string;
  code: string;
  description: string;
}

export default function RoleAddEditScreen() {
  const { roleId, role } = useLocalSearchParams<{
    roleId?: string;
    role?: string;
  }>();
  const id = roleId ? Number(roleId) : undefined;
  const editMode = !!id;

  const existingRole: RoleResponse | null = useMemo(() => {
    if (!role) return null;
    try {
      return JSON.parse(role) as RoleResponse;
    } catch {
      return null;
    }
  }, [role]);

  const { mutate: addRole, isPending: addPending } = useAddRole();
  const { mutate: updateRole, isPending: updatePending } = useUpdateRole(id);

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { name: "", code: "", description: "" },
  });

  useEffect(() => {
    if (editMode && existingRole) {
      reset({
        name: existingRole.name ?? "",
        code: existingRole.code ?? "",
        description: existingRole.description ?? "",
      });
    }
  }, [editMode, existingRole, reset]);

  const onSubmit = (values: FormValues) => {
    if (editMode) {
      updateRole(values, { onSuccess: () => router.back() });
    } else {
      addRole(values, { onSuccess: () => router.back() });
    }
  };

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon={editMode ? "create" : "shield"}
        title={editMode ? "Edit Role" : "Add Role"}
        subtitle={
          editMode
            ? "Update role information."
            : "Create a new role for staff members."
        }
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 30 }}
          enableOnAndroid
          extraScrollHeight={20}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <AppInput
                  label="Role Name"
                  value={value}
                  onChangeText={onChange}
                  placeholder="e.g. Building Manager"
                />
              )}
            />

            <View className="mt-3">
              <Controller
                control={control}
                name="code"
                render={({ field: { onChange, value } }) => (
                  <AppInput
                    label="Code"
                    value={value}
                    onChangeText={onChange}
                    placeholder="e.g. BUILDING_MANAGER"
                    autoCapitalize="characters"
                  />
                )}
              />
            </View>

            <View className="my-3">
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, value } }) => (
                  <AppInput
                    label="Description"
                    value={value}
                    onChangeText={onChange}
                    placeholder="Short description of this role"
                    multiline
                    numberOfLines={3}
                  />
                )}
              />
            </View>

            <AppButton
              loading={editMode ? updatePending : addPending}
              onPress={handleSubmit(onSubmit)}
            >
              {editMode ? "Update Role" : "Create Role"}
            </AppButton>
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}
