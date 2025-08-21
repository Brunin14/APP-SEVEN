// app/login.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !senha.trim()) {
      Alert.alert("Campos obrigatórios", "Preencha e-mail e senha.");
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email.trim(), senha);
      router.replace("/home");
    } catch (e: any) {
      Alert.alert("Erro no login", e?.message || "Verifique suas credenciais.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={styles.container}
    >
      <View style={styles.wrapper}>
        {/* LOGO */}
        <Image
          source={require("../assets/logoseven.png")}
          resizeMode="contain"
          style={styles.logo}
        />

        {/* INPUT: EMAIL */}
        <View style={styles.inputPill}>
          <Ionicons name="mail-outline" size={18} color="#6B7280" />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email:"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            returnKeyType="next"
          />
        </View>

        {/* INPUT: SENHA */}
        <View style={styles.inputPill}>
          <Ionicons name="lock-closed-outline" size={18} color="#6B7280" />
          <TextInput
            value={senha}
            onChangeText={setSenha}
            placeholder="Senha:"
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showPass}
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          <TouchableOpacity onPress={() => setShowPass(s => !s)} style={styles.eyeBtn}>
            <Ionicons
              name={showPass ? "eye-off-outline" : "eye-outline"}
              size={18}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>

        {/* BOTÃO ENVIAR (GRADIENTE LARANJA) */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleLogin}
          disabled={submitting || loading}
          style={{ width: "60%", alignSelf: "center", marginTop: 22 }}
        >
          <LinearGradient
            colors={["#F29B1D", "#D87300"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.btn,
              (submitting || loading) && { opacity: 0.8 },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Enviar</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footer}>SevenApp</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E5E5E5", // cinza claro da referência
    justifyContent: "center",
  },
  wrapper: {
    paddingHorizontal: 28,
    alignItems: "center",
  },
  logo: {
    width: 280,
    height: 160,
    marginBottom: 28,
  },
  inputPill: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 28, // pílula
    paddingHorizontal: 16,
    marginTop: 14,
    // leve sombra como no mock
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 0, // sem borda aparente
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    color: "#111827",
    fontSize: 16,
  },
  eyeBtn: { padding: 6, marginLeft: 4 },
  btn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    // sombra mais forte no botão
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 18 },
  footer: { color: "#9CA3AF", marginTop: 14, textAlign: "center" },
});
