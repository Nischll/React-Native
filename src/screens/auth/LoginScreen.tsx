import { useLoginMutation } from "@/src/api/auth.api";
import { useAuth } from "@/src/providers/AuthProvider";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const { login, refetchInit } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = useLoginMutation();

  const handleLogin = () => {
    Keyboard.dismiss();
    setIsLoading(true);
    const payload = {
      password: password,
      username: email,
    };
    loginMutation.mutate(payload, {
      onSuccess: (res) => {
        console.log("Login success:", res.data);
        login();
        refetchInit();
        setIsLoading(false);
      },
      onError: (err) => {
        console.log("Login failed:", err);
        setIsLoading(false);
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* KeyboardAvoidingView moves inputs up when keyboard appears */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Dismiss keyboard on tap outside */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              paddingHorizontal: 24,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="mb-10">
              <Text className="text-3xl font-bold text-gray-900">
                Welcome Back
              </Text>
              <Text className="mt-2 text-base text-gray-500">
                Login to continue
              </Text>
            </View>

            <View className="space-y-4">
              {/* Email */}
              <View>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  Email
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="rounded-2xl border border-gray-300 px-4 py-4 text-base text-gray-900"
                />
              </View>

              {/* Password */}
              <View>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  Password
                </Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                  className="rounded-2xl border border-gray-300 px-4 py-4 text-base text-gray-900"
                />
              </View>

              {/* Login Button */}
              <Pressable
                onPress={handleLogin}
                className="mt-4 items-center rounded-2xl bg-blue-600 py-4 active:opacity-80"
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-base font-semibold text-white">
                    Login
                  </Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
