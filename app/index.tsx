import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    const payload = {
      Email: email,
      Password: password,
    };
    console.log("Login clicked");
    console.log("payload", payload);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topSection}>
          <Text style={styles.logo}>MyApp</Text>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Login to continue and access your account
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <Pressable style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Login</Text>
          </Pressable>

          <Text style={styles.forgotText}>Forgot Password?</Text>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <Text style={styles.bottomText}>Don’t have an account?</Text>
          <Pressable onPress={() => console.log("Go to Sign Up")}>
            <Text style={styles.signUpText}> Sign Up</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingVertical: 40,
  },
  topSection: {
    marginTop: 40,
  },
  logo: {
    fontSize: 32,
    fontWeight: "800",
    color: "#2563EB",
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    lineHeight: 24,
  },
  formSection: {
    gap: 18,
  },
  inputWrapper: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: "#0F172A",
  },
  loginButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  forgotText: {
    textAlign: "center",
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 6,
  },
  bottomSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  bottomText: {
    fontSize: 15,
    color: "#64748B",
  },
  signUpText: {
    fontSize: 15,
    color: "#2563EB",
    fontWeight: "700",
  },
});
