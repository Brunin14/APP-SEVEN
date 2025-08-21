// app/AtestadoScreen.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

// --- Mock (substitua por sua API quando quiser) ---
const DUMMY_NAMES = [
  { id: "1", nome_completo: "Ana Clara Souza" },
  { id: "2", nome_completo: "Bruno Costa Ferreira" },
  { id: "3", nome_completo: "Carlos Eduardo Lima" },
  { id: "4", nome_completo: "Daniela Martins Rocha" },
  { id: "5", nome_completo: "Eduardo Oliveira Santos" },
  { id: "6", nome_completo: "Fernanda Pereira Alves" },
  { id: "7", nome_completo: "Gustavo Rodrigues Silva" },
  { id: "8", nome_completo: "Helena Almeida Ribeiro" },
  { id: "9", nome_completo: "Igor Gonçalves Barbosa" },
  { id: "10", nome_completo: "Juliana Castro Gomes" },
];

export default function AtestadoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [selectedNome, setSelectedNome] = useState<{ id: string; nome_completo: string } | null>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNomes = useMemo(
    () =>
      !searchQuery
        ? DUMMY_NAMES
        : DUMMY_NAMES.filter((u) =>
            u.nome_completo.toLowerCase().includes(searchQuery.toLowerCase())
          ),
    [searchQuery]
  );

  const tirarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão necessária", "Precisamos da sua permissão para acessar a câmera.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled) setFoto(result.assets[0].uri);
  };

  const escolherDaGaleria = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão necessária", "Precisamos da sua permissão para acessar a galeria.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setFoto(result.assets[0].uri);
  };

  const handleSelectNome = (nome: { id: string; nome_completo: string }) => {
    setSelectedNome(nome);
    setSearchQuery("");
    setModalVisible(false);
  };

  const handleEnviarAtestado = async () => {
    if (!selectedNome || !foto) {
      Alert.alert("Campos obrigatórios", "Selecione seu nome e anexe a foto do atestado.");
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    const formData = new FormData();
    formData.append("nome_completo", selectedNome.nome_completo);
    formData.append("atestado_foto", {
      uri: foto,
      name: `atestado_${Date.now()}.jpg`,
      type: "image/jpeg",
    } as any);

    try {
      const resp = await fetch("https://api.sevenplus-app.com.br/api/atestados", {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error((data as any)?.error || "Falha ao enviar.");
      }
      Alert.alert("Sucesso!", "Seu atestado foi enviado para análise do RH.");
      setSelectedNome(null);
      setFoto(null);
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Não foi possível enviar o atestado.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header com botão voltar + logo centralizada */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.replace("/home")}
          style={styles.backBtn}
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

        {/* placeholder para balancear espaço */}
        <View style={{ width: 70 }} />
      </View>

      <View style={styles.body}>
        {/* Faixa/título como no mock */}
        <View style={styles.hero}>
          <Text style={styles.title}>Enviar Atestado Médico</Text>
          <Text style={styles.subtitle}>
            Preencha os dados e anexe uma foto legível do seu atestado.
          </Text>
        </View>

        <Text style={styles.label}>Nome Completo</Text>

        {/* seletor em pílula com caret */}
        <TouchableOpacity style={styles.pillInput} onPress={() => setModalVisible(true)}>
          <Text style={selectedNome ? styles.pillText : styles.pillPlaceholder}>
            {selectedNome ? selectedNome.nome_completo : "Selecione seu nome"}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#6B7280" />
        </TouchableOpacity>

        {/* Área da imagem */}
        {foto ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: foto }} style={styles.previewImg} />
            <TouchableOpacity onPress={() => setFoto(null)} style={styles.removeBadge}>
              <FontAwesome name="times" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <FontAwesome name="image" size={44} color="#C7D2FE" />
            <Text style={styles.placeholderText}>A foto do atestado aparecerá aqui</Text>
          </View>
        )}

        {/* Botões de ação */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.whiteBtn} onPress={tirarFoto}>
            <FontAwesome name="camera" size={18} color="#0F4C81" />
            <Text style={styles.whiteBtnText}>Tirar Foto</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.whiteBtn} onPress={escolherDaGaleria}>
            <FontAwesome name="photo" size={18} color="#0F4C81" />
            <Text style={styles.whiteBtnText}>Da Galeria</Text>
          </TouchableOpacity>
        </View>

        {/* Enviar */}
        <TouchableOpacity
          onPress={handleEnviarAtestado}
          disabled={!selectedNome || !foto || submitting}
          style={[styles.submitBtn, (!selectedNome || !foto || submitting) && { opacity: 0.7 }]}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitText}>Enviar atestado</Text>
              <Text style={styles.submitArrow}>  ›</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de nomes */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Selecione seu Nome</Text>

            <TextInput
              style={styles.search}
              placeholder="Pesquisar nome..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <FlatList
              data={filteredNomes}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => handleSelectNome(item)}>
                  <Text style={styles.modalItemText}>{item.nome_completo}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.empty}>Nenhum nome encontrado</Text>}
              style={{ alignSelf: "stretch" }}
            />

            {/* Botão Fechar com gradiente vermelho */}
            <TouchableOpacity style={styles.modalCloseWrapper} onPress={() => setModalVisible(false)}>
              <LinearGradient
                colors={["#ef4444", "#b91c1c"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.modalClose}
              >
                <Text style={styles.modalCloseText}>Fechar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const CARD = 16;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#E5E5E5" },

  // Header
  header: {
    backgroundColor: "#fff",
    paddingBottom: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4 as any },
  backText: { color: "#1E3A8A", fontWeight: "800" },
  logo: { width: 220, height: 50 },

  body: { flex: 1, paddingHorizontal: 16, paddingBottom: 24 },

  // faixa de título
  hero: { paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: "900", color: "#1E3A8A" },
  subtitle: { fontSize: 14, color: "#6B7280", marginTop: 6 },

  label: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 15,
    fontWeight: "800",
    color: "#374151",
  },

  pillInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pillText: { color: "#111827", fontSize: 16 },
  pillPlaceholder: { color: "#9CA3AF", fontSize: 16 },

  // preview/placeholder
  placeholder: {
    height: 200,
    backgroundColor: "#86A3C3",
    borderRadius: 18,
    marginTop: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { marginTop: 8, color: "#E5EDF6" },

  previewWrap: {
    marginTop: 14,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#86A3C3",
    alignItems: "center",
  },
  previewImg: { width: "100%", height: 220, resizeMode: "contain" },
  removeBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  whiteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8 as any,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    width: "48%",
    justifyContent: "center",
  },
  whiteBtnText: { color: "#0F4C81", fontWeight: "800" },

  submitBtn: {
    alignSelf: "center",
    marginTop: 18,
    width: "65%",
    backgroundColor: "#EA8A1A",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  submitArrow: { color: "#fff", fontSize: 20, fontWeight: "900" },

  // modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    maxHeight: "80%",
  },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 10 },
  search: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  modalItemText: { fontSize: 16, color: "#374151" },
  empty: { textAlign: "center", color: "#6B7280", marginTop: 10 },

  // botão fechar com gradiente
  modalCloseWrapper: {
    marginTop: 12,
    borderRadius: 10,
    overflow: "hidden",
  },
  modalClose: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  modalCloseText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
