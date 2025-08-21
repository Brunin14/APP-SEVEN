import React, { useEffect, useState, useCallback, memo } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

type Comunicado = {
  id: number;
  titulo: string;
  corpo: string;
  created_at: string;
};

// Formulário extraído para seu próprio componente
const FormularioComunicado = ({ titulo, corpo, setTitulo, setCorpo, enviarComunicado, submitting }: any) => (
  <>
    <View style={styles.hero}>
      <Text style={styles.headerTitle}>Mural de Comunicados</Text>
      <Text style={styles.headerSubtitle}>Enviado pelo RH</Text>
    </View>
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>Criar Novo Comunicado</Text>
      <TextInput
        placeholder="Título do comunicado"
        value={titulo}
        onChangeText={setTitulo}
        style={styles.input}
        placeholderTextColor="#94a3b8"
      />
      <TextInput
        placeholder="Digite a mensagem aqui..."
        value={corpo}
        onChangeText={setCorpo}
        multiline
        numberOfLines={4}
        style={[styles.input, { height: 100, textAlignVertical: "top" }]}
        placeholderTextColor="#94a3b8"
      />
      <TouchableOpacity
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={enviarComunicado}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <FontAwesome name="send" size={18} color="white" />
            <Text style={styles.buttonText}>Enviar e Notificar</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  </>
);

// CORRIGIDO: Componente para a lista vazia, memorizado para evitar re-renderizações desnecessárias
const EmptyListComponent = memo(() => (
  <View style={styles.emptyContainer}>
    <FontAwesome name="inbox" size={40} color="#94a3b8" />
    <Text style={styles.emptyTitle}>Nenhum comunicado</Text>
    <Text style={styles.emptySubtitle}>Ainda não há nada por aqui.</Text>
  </View>
));


export default function ComunicadosPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComunicados = useCallback(() => {
    setLoading(true);
    fetch("https://api.sevenplus-app.com.br/api/comunicados")
      .then((res) => res.json())
      .then((data) => setComunicados(data))
      .catch((err) => {
        console.error("Erro ao carregar comunicados:", err);
        Alert.alert("Erro", "Não foi possível carregar os comunicados.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchComunicados();
  }, [fetchComunicados]);

  const enviarComunicado = useCallback(async () => {
    if (!titulo.trim() || !corpo.trim()) {
      return Alert.alert("Atenção", "Preencha o título e a mensagem.");
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("https://api.sevenplus-app.com.br/api/comunicados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, corpo }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Falha ao salvar o comunicado.");
      }

      const novo = await res.json();
      setComunicados((prev) => [novo, ...prev]);
      setTitulo("");
      setCorpo("");
      Alert.alert("Sucesso!", "✅ Comunicado enviado e notificação disparada!");
    } catch (err: any) {
      console.error("Erro ao enviar comunicado:", err);
      Alert.alert("Erro", err.message || "Não foi possível enviar o comunicado.");
    } finally {
      setSubmitting(false);
    }
  }, [titulo, corpo, submitting]);

  const renderItem = ({ item }: { item: Comunicado }) => (
    <View style={styles.cardShadow}>
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.titulo}</Text>
          <Text style={styles.cardBody}>{item.corpo}</Text>
        </View>
        <Text style={styles.cardDate}>
          {new Date(item.created_at).toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.replace("/home")}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={22} color="#1E3A8A" />
          <Text style={styles.backText}>Home</Text>
        </TouchableOpacity>
        <Image
          source={require("../assets/Logo-Esticada.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={{ width: 70 }} />
      </View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0F4C81" />
            <Text style={styles.loadingText}>Carregando comunicados...</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <FlatList
              data={comunicados}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
              ListHeaderComponent={
                <FormularioComunicado
                  titulo={titulo}
                  corpo={corpo}
                  setTitulo={setTitulo}
                  setCorpo={setCorpo}
                  enviarComunicado={enviarComunicado}
                  submitting={submitting}
                />
              }
              // CORRIGIDO: Usando o componente memorizado
              ListEmptyComponent={EmptyListComponent}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const CARD_RADIUS = 18;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#E5E5E5" },
  header: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 10,
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    width: "100%",
    flexDirection: "row",
    paddingHorizontal: 12,
  },
  logo: { width: 220, height: 50 },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4 as any,
    width: 70,
  },
  backText: { color: "#1E3A8A", fontWeight: "800" },
  hero: {
    paddingTop: 14,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#1E3A8A" },
  headerSubtitle: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 8, color: "#64748b" },
  listContainer: {
    flex: 1,
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    padding: 20,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    marginHorizontal: 16,
  },
  emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: "600", color: "#334155" },
  emptySubtitle: { textAlign: "center", color: "#64748b" },
  cardShadow: {
    borderRadius: CARD_RADIUS,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    marginBottom: 14,
    marginHorizontal: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitle: { fontSize: 18, fontWeight: "800", color: "#1f2937", marginBottom: 2 },
  cardBody: { fontSize: 15.5, color: "#475569" },
  cardDate: { fontSize: 12, color: "#94a3b8", marginTop: 12, alignSelf: "flex-end" },
  formContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 24,
    marginTop: 12,
    marginHorizontal: 16,
  },
  formTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12, color: "#334155" },
  input: {
    backgroundColor: "#F1F5F9",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  button: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10 as any,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "800" },
});
