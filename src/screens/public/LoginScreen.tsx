import { useLoginMutation } from "@/src/api/auth.api";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import PasswordInput from "@/src/components/ui/PasswordInput";
import { useAuth } from "@/src/providers/AuthProvider";
import { useState } from "react";
import {
  Image,
  Keyboard,
  Text,
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
          <View className="flex-1 justify-center ">
            <View className="rounded-3xl bg-white px-6 py-8 gap-4">
              {/* Logo */}
              <View className="items-center">
                <Image
                  source={require("../../../assets/images/logo.png")}
                  className="h-24 w-52"
                  resizeMode="contain"
                />

                <Text className="mt-2 text-xl font-bold text-gray-900">
                  Welcome Back
                </Text>
                <Text className="text-center text-base text-gray-500">
                  Login to continue to your account
                </Text>
              </View>

              {/* Username */}
              <AppInput
                label="Username"
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your username"
                autoCapitalize="none"
                leftIcon="person-outline"
                size="md"
              />

              {/* Password */}
              <PasswordInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                size="md"
              />

              {/* Login Button */}
              <AppButton
                size="md"
                onPress={handleLogin}
                loading={isPending || isFinishingLogin}
              >
                Login
              </AppButton>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
