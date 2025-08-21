// app/copy-hub.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  SafeAreaView,
  Alert,
  Modal,
  Image,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // 1. Importar o hook

const API_URL = "https://api.sevenplus-app.com.br/api/copys";

// --- Tipos e Constantes (sem alterações) ---
type CopyItem = {
  id: number;
  title?: string;
  hook?: string;
  development?: string;
  cta?: string;
  hashtags?:string;
  RESPONSAVEL?: "Ninguém" | "Shinji" | "Leticia" | string;
  ESTADO?: "Pendente" | "Em Andamento" | "Pronto" | "A Fazer" | string;
};
const RESPONSAVEIS = ["Shinji", "Leticia", "Ninguém"] as const;
const STATUS = ["A Fazer", "Em Andamento", "Pronto"] as const;

// --- Funções de Cor (sem alterações) ---
function colorForResponsible(resp?: string) {
  switch ((resp || "").toLowerCase()) {
    case "shinji": return { bg: "#111111", fg: "#FFFFFF" };
    case "leticia": return { bg: "#B91C1C", fg: "#FFFFFF" };
    default: return { bg: "#6B7280", fg: "#FFFFFF" };
  }
}
function colorForStatus(st?: string) {
  switch ((st || "").toLowerCase()) {
    case "pronto": return { bg: "#22C55E", fg: "#FFFFFF" };
    case "em andamento": return { bg: "#F97316", fg: "#FFFFFF" };
    default: return { bg: "#0F4C81", fg: "#FFFFFF" };
  }
}

// --- Componente PickerModal (sem alterações) ---
type PickerModalProps = {
  visible: boolean;
  title: string;
  options: readonly string[];
  selectedValue: string;
  onClose: () => void;
  onSelect: (value: string) => void;
};
const PickerModal = ({ visible, title, options, selectedValue, onClose, onSelect }: PickerModalProps) => {
  const [currentValue, setCurrentValue] = useState(selectedValue);

  useEffect(() => {
    setCurrentValue(selectedValue);
  }, [selectedValue, visible]);

  const handleSave = () => {
    onSelect(currentValue);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modalStyles.backdrop}>
        <View style={modalStyles.card}>
          <Text style={modalStyles.title}>{title}</Text>
          <Picker 
            selectedValue={currentValue} 
            onValueChange={(itemValue) => setCurrentValue(itemValue)}
            itemStyle={{ color: '#000000', fontWeight: '500' }} 
          >
            {options.map(opt => <Picker.Item key={opt} label={opt} value={opt} />)}
          </Picker>
          <View style={modalStyles.buttons}>
            <TouchableOpacity style={modalStyles.button} onPress={onClose}>
              <Text style={modalStyles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[modalStyles.button, modalStyles.buttonSave]} onPress={handleSave}>
              <Text style={[modalStyles.buttonText, { color: '#fff' }]}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// --- Componente BarSelect (sem alterações) ---
type BarSelectProps = {
  value: string;
  onPress: () => void;
  bg: string;
  fg?: string;
};
const BarSelect = ({ value, onPress, bg, fg = "#fff" }: BarSelectProps) => (
  <TouchableOpacity onPress={onPress} style={[styles.barSelectWrap, { backgroundColor: bg }]}>
    <Text style={[styles.barSelectText, { color: fg }]}>{value}</Text>
    <FontAwesome name="caret-down" size={18} color={fg} style={styles.caret} />
  </TouchableOpacity>
);


export default function CopyHubPage() {
  const [copies, setCopies] = useState<CopyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    options: readonly string[];
    selectedValue: string;
    onSelect: (value: string) => void;
  } | null>(null);

  const router = useRouter();
  const insets = useSafeAreaInsets(); // 2. Obter os valores da área segura

  async function fetchCopies() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Falha na resposta da rede');
      const data = await res.json();
      setCopies(data);
    } catch (err) {
      console.error("Erro ao carregar copys:", err);
      setError("Erro ao carregar as copys.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCopies();
  }, []);

  async function handleUpdateField(id: number, field: string, value: string) {
    setCopies(prevCopies => prevCopies.map(copy => copy.id === id ? { ...copy, [field]: value } : copy));
    try {
      await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
    } catch (err) {
      console.error("Erro ao atualizar campo:", err);
      fetchCopies();
    }
  }

  async function handleDelete(id: number) {
    Alert.alert(
      "Confirmar Exclusão",
      "Você tem certeza que deseja excluir esta copy? A ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            setCopies(prevCopies => prevCopies.filter(copy => copy.id !== id));
            try {
              await fetch(`${API_URL}/${id}`, { method: "DELETE" });
            } catch (err) {
              console.error("Erro ao deletar:", err);
              Alert.alert("Erro", "Não foi possível excluir a copy.");
              fetchCopies();
            }
          },
        },
      ]
    );
  }

  const openPickerModal = (item: CopyItem, type: 'RESPONSAVEL' | 'ESTADO') => {
    setModalConfig({
      visible: true,
      title: type === 'RESPONSAVEL' ? 'Selecionar Responsável' : 'Selecionar Estado',
      options: type === 'RESPONSAVEL' ? RESPONSAVEIS : STATUS,
      selectedValue: item[type] || (type === 'RESPONSAVEL' ? 'Ninguém' : 'A Fazer'),
      onSelect: (value) => handleUpdateField(item.id, type, value),
    });
  };

  return (
    // SafeAreaView foi movido para envolver apenas o conteúdo, não o header customizado
    <View style={styles.screen}>
      {/* 3. HEADER ATUALIZADO para usar o padding do inset */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.replace("/home")} style={styles.backBtn}>
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

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.title}>Central de Copys</Text>
          <Text style={styles.subtitle}>Gerencie o status e os responsáveis de cada copy.</Text>
        </View>

        {loading ? <ActivityIndicator size="large" color="#1E3A8A" />
         : error ? <Text style={styles.error}>{error}</Text>
         : copies.map((item) => {
            const isExpanded = expandedId === item.id;
            const respColors = colorForResponsible(item.RESPONSAVEL);
            const statColors = colorForStatus(item.ESTADO);

            return (
              <View key={item.id} style={styles.cardShadow}>
                <View style={styles.card}>
                  <TouchableOpacity onPress={() => setExpandedId(isExpanded ? null : item.id)} activeOpacity={0.9}>
                    <Text style={styles.cardTitle}>{item.title || "Sem Título"}</Text>
                  </TouchableOpacity>

                  <BarSelect
                    value={item.RESPONSAVEL || "Ninguém"}
                    onPress={() => openPickerModal(item, 'RESPONSAVEL')}
                    bg={respColors.bg}
                    fg={respColors.fg}
                  />
                  <BarSelect
                    value={item.ESTADO || "A Fazer"}
                    onPress={() => openPickerModal(item, 'ESTADO')}
                    bg={statColors.bg}
                    fg={statColors.fg}
                  />

                  {isExpanded && (
                    <View style={styles.detailsContainer}>
                      <Text style={styles.copyText}><Text style={styles.bold}>Hook: </Text>{item.hook || "---"}</Text>
                      <Text style={styles.copyText}><Text style={styles.bold}>Desenvolvimento: </Text>{item.development || "---"}</Text>
                      <Text style={styles.copyText}><Text style={styles.bold}>CTA: </Text>{item.cta || "---"}</Text>
                      <Text style={styles.copyText}><Text style={styles.bold}>Hashtags: </Text>{item.hashtags || "---"}</Text>
                    </View>
                  )}

                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                    <FontAwesome name="trash" size={18} color="#B91C1C" />
                    <Text style={styles.deleteBtnText}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
      </ScrollView>

      {modalConfig && (
        <PickerModal
          visible={modalConfig.visible}
          title={modalConfig.title}
          options={modalConfig.options}
          selectedValue={modalConfig.selectedValue}
          onClose={() => setModalConfig(null)}
          onSelect={modalConfig.onSelect}
        />
      )}
    </View>
  );
}

const CARD_RADIUS = 18;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#E5E5E5" },
  // 4. ESTILOS DO HEADER ATUALIZADOS
  header: {
    backgroundColor: "#fff",
    // paddingTop agora é dinâmico
    paddingBottom: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 4 as any,
    width: 70,
  },
  backText: { color: "#1E3A8A", fontWeight: "800" },
  logo: { 
    width: 200, 
    height: 50 
  },
  hero: { 
    paddingTop: 16, 
    paddingBottom: 12 
  },
  title: { 
    fontSize: 26, 
    fontWeight: "900", 
    color: "#1E3A8A" 
  },
  subtitle: { 
    fontSize: 14, 
    color: "#6B7280", 
    marginTop: 6 
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  error: { color: "#DC2626", textAlign: 'center' },
  cardShadow: {
    borderRadius: CARD_RADIUS,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 12,
  },
  barSelectWrap: {
    borderRadius: 12,
    marginTop: 10,
    height: 52,
    justifyContent: "center",
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barSelectText: {
    fontSize: 16,
    fontWeight: '700',
  },
  caret: {},
  detailsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  copyText: {
    marginTop: 8,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  bold: { fontWeight: "bold" },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: "center",
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: "#FEE2E2",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'flex-end',
  },
  deleteBtnText: {
    color: '#B91C1C',
    fontWeight: '700',
  }
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  buttons: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  buttonSave: {
    backgroundColor: '#0F4C81',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
});
