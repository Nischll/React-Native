import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isLoading = false;

  const handleLogin = () => {
    console.log("Login pressed", { email, password });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center px-6">
        <View className="mb-10">
          <Text className="text-3xl font-bold text-gray-900">Welcome Back</Text>
          <Text className="mt-2 text-base text-gray-500">
            Login to continue
          </Text>
        </View>

        <View className="gap-4">
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

          <Pressable
            onPress={handleLogin}
            className="mt-4 items-center rounded-2xl bg-blue-600 py-4 active:opacity-80"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-base font-semibold text-white">Login</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
