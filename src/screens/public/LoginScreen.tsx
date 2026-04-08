import { useLoginMutation } from "@/src/api/auth.api";
import { useAuth } from "@/src/providers/AuthProvider";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isFinishingLogin, setIsFinishingLogin] = useState(false);

  const { mutate: loginMutation, isPending } = useLoginMutation();

  const handleLogin = () => {
    Keyboard.dismiss();

    const payload = { username, password };

    loginMutation(payload, {
      onSuccess: async () => {
        try {
          setIsFinishingLogin(true);
          await login();
        } finally {
          setIsFinishingLogin(false);
        }
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 12,
            paddingTop: 30,
            paddingBottom: 30,
          }}
          enableOnAndroid
          extraScrollHeight={20}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 justify-center">
            <View className="rounded-3xl bg-white px-6 py-8">
              {/* Logo */}
              <View className="mb-10 items-center">
                <Image
                  source={require("../../../assets/images/logo.png")}
                  className="h-24 w-52"
                  resizeMode="contain"
                />

                <Text className="mt-6 text-3xl font-bold text-gray-900">
                  Welcome Back
                </Text>
                <Text className="mt-2 text-center text-base text-gray-500">
                  Login to continue to your account
                </Text>
              </View>

              {/* Username */}
              <View className="mb-6">
                <Text className="mb-2 text-lg font-semibold text-gray-700">
                  Username
                </Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter your username"
                  autoCapitalize="none"
                  className="rounded-2xl border border-gray-300 focus:border-blue-600 bg-gray-50 px-4 py-4 text-base text-gray-900"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Password */}
              <View className="mb-8">
                <Text className="mb-2 text-lg font-semibold text-gray-700">
                  Password
                </Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                  className="rounded-2xl border border-gray-300 focus:border-blue-600 bg-gray-50 px-4 py-4 text-base text-gray-900"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Login Button */}
              <Pressable
                onPress={handleLogin}
                disabled={isPending || isFinishingLogin}
                className={`items-center rounded-2xl py-4 ${
                  isPending || isFinishingLogin ? "bg-blue-400" : "bg-blue-600"
                }`}
              >
                {isPending || isFinishingLogin ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-base font-semibold text-white">
                    Login
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
