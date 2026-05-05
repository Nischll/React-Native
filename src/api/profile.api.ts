import { useApiMutation } from "../hooks/api/useApiMutation";

export const useUpdateProfile = () => useApiMutation("put", "/auth/profile");
