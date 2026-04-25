import { Pressable, Text, View } from "react-native";
import Toast, { ToastConfig } from "react-native-toast-message";

export const toastConfig: ToastConfig = {
  success: ({ text1, text2 }) => (
    <View className="w-[72%] self-center rounded-xl border border-emerald-400 bg-emerald-50 px-4 py-2 shadow-md">
      <View className="flex-row items-center gap-3">
        {/* Icon */}
        <View className="h-8 w-8 items-center justify-center rounded-2xl bg-emerald-600">
          <Text className="text-lg font-bold text-white">✓</Text>
        </View>

        {/* Text */}
        <View className="flex-1">
          <Text className="text-md font-bold text-emerald-950">
            {text1 || "Success"}
          </Text>

          {!!text2 && (
            <Text className=" text-sm leading-5 text-emerald-900/80">
              {text2}
            </Text>
          )}
        </View>

        {/* Close */}
        <Pressable
          onPress={() => Toast.hide()}
          className="h-8 w-8 items-center justify-center rounded-full bg-emerald-100 active:opacity-70"
        >
          <Text className="text-base font-bold text-emerald-700">✕</Text>
        </Pressable>
      </View>
    </View>
  ),

  error: ({ text1, text2 }) => (
    <View className="w-[72%] self-center rounded-xl border border-red-400 bg-red-50 px-4 py-2 shadow-md">
      <View className="flex-row items-center gap-3">
        {/* Icon */}
        <View className="h-8 w-8 items-center justify-center rounded-2xl bg-red-600">
          <Text className="text-lg font-bold text-white">!</Text>
        </View>

        {/* Text */}
        <View className="flex-1">
          <Text className="text-md font-bold text-red-950">
            {text1 || "Error"}
          </Text>

          {!!text2 && (
            <Text className="text-sm leading-5 text-red-900/80">{text2}</Text>
          )}
        </View>

        {/* Close */}
        <Pressable
          onPress={() => Toast.hide()}
          className="h-8 w-8 items-center justify-center rounded-full bg-red-100 active:opacity-70"
        >
          <Text className="text-base font-bold text-red-700">✕</Text>
        </Pressable>
      </View>
    </View>
  ),
};
