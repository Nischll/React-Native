import { useGetBuildings } from "@/src/api/building.api";
import { useAddStaff, useGetActiveRoles, useUpdateStaff } from "@/src/api/employee.api";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import { FilePicker, PickedFile } from "@/src/components/ui/FilePicker";
import PasswordInput from "@/src/components/ui/PasswordInput";
import SelectField from "@/src/components/ui/SelectField";
import {
  Employee,
  NATURE_OF_EMPLOYMENT_OPTIONS,
  NatureOfEmployment,
} from "@/src/types/employee.types";
import { Building } from "@/src/types/building.types";
import { extractPaginatedList } from "@/src/utils/listPagination";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, TouchableWithoutFeedback, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

interface FormValues {
  firstName: string;
  middleName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  phoneNumber: string;
  employeeNumber: string;
  natureOfEmployment: NatureOfEmployment | "";
  position: string;
  roleList: string[];
  buildingList: string[];
  profilePicture: PickedFile | null;
}

export default function StaffAddEditScreen() {
  const { userId, employee } = useLocalSearchParams<{
    userId?: string;
    employee?: string;
  }>();
  const id = userId ? Number(userId) : undefined;
  const editMode = !!id;

  const existingEmployee: Employee | null = useMemo(() => {
    if (!employee) return null;
    try {
      return JSON.parse(employee) as Employee;
    } catch {
      return null;
    }
  }, [employee]);

  const { data: rolesData } = useGetActiveRoles();
  const { data: buildingsData } = useGetBuildings();

  const roleOptions = (rolesData?.data ?? []).map((role) => ({
    label: role.name,
    value: String(role.id),
  }));
  const buildingOptions = extractPaginatedList<Building>(buildingsData).items.map((building) => ({
    label: building.name ?? `Building ${building.id}`,
    value: String(building.id),
  }));

  const { mutate: addStaff, isPending: addPending } = useAddStaff();
  const { mutate: updateStaff, isPending: updatePending } =
    useUpdateStaff(id);

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      phoneNumber: "",
      employeeNumber: "",
      natureOfEmployment: "",
      position: "",
      roleList: [],
      buildingList: [],
      profilePicture: null,
    },
  });

  useEffect(() => {
    if (editMode && existingEmployee) {
      reset({
        firstName: existingEmployee.firstName ?? "",
        middleName: existingEmployee.middleName ?? "",
        lastName: existingEmployee.lastName ?? "",
        username: existingEmployee.username ?? "",
        email: existingEmployee.email ?? "",
        password: "",
        phoneNumber: existingEmployee.phoneNumber ?? "",
        employeeNumber: existingEmployee.employeeNumber ?? "",
        natureOfEmployment:
          (existingEmployee.natureOfEmployment as NatureOfEmployment) ?? "",
        position: existingEmployee.position ?? "",
        roleList: (existingEmployee.roleList ?? []).map((r: any) =>
          String(typeof r === "object" ? r.id : r),
        ),
        buildingList: (existingEmployee.buildingList ?? []).map((b: any) =>
          String(typeof b === "object" ? b.id : b),
        ),
        profilePicture: null,
      });
    }
  }, [editMode, existingEmployee, reset]);

  const onSubmit = (values: FormValues) => {
    const formData = new FormData();
    formData.append("firstName", values.firstName);
    formData.append("lastName", values.lastName);
    if (values.middleName) formData.append("middleName", values.middleName);
    formData.append("username", values.username);
    formData.append("email", values.email);
    if (values.phoneNumber) formData.append("phoneNumber", values.phoneNumber);
    if (values.employeeNumber)
      formData.append("employeeNumber", values.employeeNumber);
    if (values.natureOfEmployment)
      formData.append("natureOfEmployment", values.natureOfEmployment);
    if (values.position) formData.append("position", values.position);

    values.roleList.forEach((roleId) => formData.append("roleList", roleId));
    values.buildingList.forEach((buildingId) =>
      formData.append("buildingList", buildingId),
    );

    if (values.password) {
      formData.append("password", values.password);
    } else if (!editMode) {
      formData.append("password", "");
    }

    if (values.profilePicture) {
      formData.append("profilePicture", {
        uri: values.profilePicture.uri,
        name: values.profilePicture.name,
        type: values.profilePicture.mimeType,
      } as any);
    }

    if (editMode) {
      updateStaff(formData as any, {
        onSuccess: () => router.back(),
      });
    } else {
      addStaff(formData as any, {
        onSuccess: () => router.back(),
      });
    }
  };

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon={editMode ? "create" : "person-add"}
        title={editMode ? "Edit Staff" : "Add Staff"}
        subtitle={
          editMode
            ? "Update employee information and access."
            : "Create a new employee account."
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
              name="firstName"
              render={({ field: { onChange, value } }) => (
                <AppInput
                  label="First Name"
                  value={value}
                  onChangeText={onChange}
                  placeholder="First name"
                />
              )}
            />

            <View className="mt-3">
              <Controller
                control={control}
                name="middleName"
                render={({ field: { onChange, value } }) => (
                  <AppInput
                    label="Middle Name"
                    value={value}
                    onChangeText={onChange}
                    placeholder="Middle name"
                  />
                )}
              />
            </View>

            <View className="mt-3">
              <Controller
                control={control}
                name="lastName"
                render={({ field: { onChange, value } }) => (
                  <AppInput
                    label="Last Name"
                    value={value}
                    onChangeText={onChange}
                    placeholder="Last name"
                  />
                )}
              />
            </View>

            <View className="mt-3">
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, value } }) => (
                  <AppInput
                    label="Username"
                    value={value}
                    onChangeText={onChange}
                    placeholder="e.g. john.doe"
                    autoCapitalize="none"
                  />
                )}
              />
            </View>

            <View className="mt-3">
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <AppInput
                    label="Email"
                    value={value}
                    onChangeText={onChange}
                    placeholder="name@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
              />
            </View>

            <View className="mt-3">
              <Controller
                control={control}
                name="phoneNumber"
                render={({ field: { onChange, value } }) => (
                  <AppInput
                    label="Phone Number"
                    value={value}
                    onChangeText={onChange}
                    placeholder="Phone number"
                    keyboardType="phone-pad"
                  />
                )}
              />
            </View>

            <View className="mt-3">
              <Controller
                control={control}
                name="employeeNumber"
                render={({ field: { onChange, value } }) => (
                  <AppInput
                    label="Employee Number"
                    value={value}
                    onChangeText={onChange}
                    placeholder="Employee number"
                  />
                )}
              />
            </View>

            <View className="mt-3">
              <Controller
                control={control}
                name="natureOfEmployment"
                render={({ field: { onChange, value } }) => (
                  <SelectField
                    label="Nature of Employment"
                    value={value}
                    onChange={onChange}
                    options={NATURE_OF_EMPLOYMENT_OPTIONS}
                    placeholder="Select nature of employment"
                    mode="dropdown"
                  />
                )}
              />
            </View>

            <View className="mt-3">
              <Controller
                control={control}
                name="position"
                render={({ field: { onChange, value } }) => (
                  <AppInput
                    label="Position"
                    value={value}
                    onChangeText={onChange}
                    placeholder="Position"
                  />
                )}
              />
            </View>

            <View className="mt-3">
              <Controller
                control={control}
                name="roleList"
                render={({ field: { onChange, value } }) => (
                  <SelectField
                    multi
                    label="Roles"
                    value={value}
                    onChange={onChange}
                    options={roleOptions}
                    placeholder="Select roles"
                  />
                )}
              />
            </View>

            <View className="mt-3">
              <Controller
                control={control}
                name="buildingList"
                render={({ field: { onChange, value } }) => (
                  <SelectField
                    multi
                    label="Buildings"
                    value={value}
                    onChange={onChange}
                    options={buildingOptions}
                    placeholder="Select buildings"
                  />
                )}
              />
            </View>

            <View className="mt-3">
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <PasswordInput
                    label={editMode ? "New Password (optional)" : "Password"}
                    value={value}
                    onChangeText={onChange}
                    placeholder="Password"
                  />
                )}
              />
            </View>

            <View className="mt-3 mb-3">
              <Controller
                control={control}
                name="profilePicture"
                render={({ field: { onChange, value } }) => (
                  <FilePicker
                    label="Profile Picture"
                    accept="images"
                    value={value}
                    onChange={onChange}
                    compact
                  />
                )}
              />
            </View>

            <AppButton
              loading={editMode ? updatePending : addPending}
              onPress={handleSubmit(onSubmit)}
            >
              {editMode ? "Update Staff" : "Create Staff"}
            </AppButton>
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}
