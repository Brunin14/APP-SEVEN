// app/resultados-formularios.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
  Image,
  RefreshControl,
  Modal,
  ScrollView,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const API_URL = "https://api.sevenplus-app.com.br/api";

type FormularioResultado = {
  id: number;
  cnpj: string;
  telefone: string;
  endereco: string;
  horario_funcionamento: string;
  metros_quadrados: string;
  quant_funcionarios: number;
  processo_operacional: string;
  responsavel_legal_nome: string;
  responsavel_legal_cargo: string;
  responsavel_legal_contato: string;
  responsavel_tecnico_nome: string;
  responsavel_tecnico_cargo: string;
  responsavel_tecnico_registro: string;
  responsavel_tecnico_contato: string;
  residuos: string; // JSON string
  empresas_coleta: string; // JSON string
  destinacaoFinal: string; // JSON string
  caracteristicasResiduos: string; // JSON string
  epis_transporte: string;
  abrigo_residuos_localizacao: string;
  pgr_razao_social: string;
  possui_documentos_cnpj: string;
  possui_restaurante: string;
  restaurante_tipo: string;
  refeicoes_tipo: string;
  refeicoes_media_dia: number;
  saude_ocupacional_unidade: string;
  saude_ocupacional_endereco: string;
  realiza_dedetizacao: string;
  dedetizacao_razao_social: string;
  dedetizacao_cnpj: string;
  dedetizacao_frequencia: string;
  realiza_limpeza_caixa_dagua: string;
  limpeza_caixa_dagua_cnpj: string;
  limpeza_caixa_dagua_frequencia: string;
  caixas_dagua_fechadas: string;
  abastecimento_agua: string;
  esgoto_sanitario: string;
  created_at?: string;
};

type BuscarFormulariosResponse = {
  data: FormularioResultado[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
};

// ---- Componentes auxiliares (iguais ao seu código) ----
const DetailRow = ({ label, value }: { label: string; value: any }) => {
  const displayValue = value || "Não informado";
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailText}>{displayValue}</Text>
    </View>
  );
};

const JsonDetailList = ({ label, jsonString }: { label: string; jsonString: string | null | undefined }) => {
  let items: any[] = [];
  try {
    if (jsonString) items = JSON.parse(jsonString);
  } catch (e) {
    console.log(e);
    return <DetailRow label={label} value="Dado em formato inválido" />;
  }

  if (!Array.isArray(items) || items.length === 0) {
    return <DetailRow label={label} value="Nenhum item informado" />;
  }

  const formatKey = (key: string) => key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      {items.map((item, index) => (
        <View key={index} style={styles.jsonItemContainer}>
          {Object.entries(item).map(([key, value]) => {
            if (key.toLowerCase() === "id") return null;
            return (
              <Text key={key} style={styles.jsonItemText}>
                <Text style={{ fontWeight: "500" }}>{formatKey(key)}:</Text> {String(value)}
              </Text>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const DetailsModal = ({
  visible, onClose, item, onDelete,
}: {
  visible: boolean;
  onClose: () => void;
  item: FormularioResultado | null;
  onDelete: (id: number) => void;
}) => {
  if (!item) return null;

  const handleDeletePress = () => {
    onClose();
    setTimeout(() => onDelete(item.id), 500);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalScrollView}>
            <Text style={styles.modalTitle}>{item.pgr_razao_social}</Text>

            <Text style={styles.modalSectionTitle}>Informações Gerais</Text>
            <DetailRow label="CNPJ" value={item.cnpj} />
            <DetailRow label="Endereço" value={item.endereco} />
            <DetailRow label="Telefone" value={item.telefone} />
            <DetailRow label="Funcionamento" value={item.horario_funcionamento} />
            <DetailRow label="Área (m²)" value={item.metros_quadrados} />
            <DetailRow label="Nº de Funcionários" value={item.quant_funcionarios} />
            <DetailRow label="Processo Operacional" value={item.processo_operacional} />
            <DetailRow label="Possui documentos (CNPJ, etc.)?" value={item.possui_documentos_cnpj} />

            <Text style={styles.modalSectionTitle}>Responsáveis</Text>
            <DetailRow label="Legal" value={`${item.responsavel_legal_nome} (${item.responsavel_legal_cargo})`} />
            <DetailRow label="Contato Legal" value={item.responsavel_legal_contato} />
            <DetailRow label="Técnico" value={`${item.responsavel_tecnico_nome} (${item.responsavel_tecnico_cargo})`} />
            <DetailRow label="Contato Técnico" value={item.responsavel_tecnico_contato} />
            <DetailRow label="Registro Técnico" value={item.responsavel_tecnico_registro} />

            <Text style={styles.modalSectionTitle}>Gerenciamento de Resíduos</Text>
            <JsonDetailList label="Resíduos Gerados" jsonString={item.residuos} />
            <JsonDetailList label="Empresas de Coleta" jsonString={item.empresas_coleta} />
            <JsonDetailList label="Destinação Final" jsonString={item.destinacaoFinal} />
            <JsonDetailList label="Características dos Resíduos" jsonString={item.caracteristicasResiduos} />
            <DetailRow label="EPIs para Transporte" value={item.epis_transporte} />
            <DetailRow label="Local do Abrigo" value={item.abrigo_residuos_localizacao} />

            <Text style={styles.modalSectionTitle}>Restaurante</Text>
            <DetailRow label="Possui Restaurante" value={item.possui_restaurante} />
            <DetailRow label="Tipo de Restaurante" value={item.restaurante_tipo} />
            <DetailRow label="Tipo de Refeições" value={item.refeicoes_tipo} />
            <DetailRow label="Média de Refeições/Dia" value={item.refeicoes_media_dia} />

            <Text style={styles.modalSectionTitle}>Saúde Ocupacional</Text>
            <DetailRow label="Unidade" value={item.saude_ocupacional_unidade} />
            <DetailRow label="Endereço" value={item.saude_ocupacional_endereco} />

            <Text style={styles.modalSectionTitle}>Serviços de Terceiros</Text>
            <DetailRow label="Realiza Dedetização" value={item.realiza_dedetizacao} />
            <DetailRow label="Empresa Dedetização" value={`${item.dedetizacao_razao_social} (${item.dedetizacao_cnpj || "CNPJ não inf."})`} />
            <DetailRow label="Frequência Dedetização" value={item.dedetizacao_frequencia} />
            <DetailRow label="Realiza Limpeza Caixa d'Água" value={item.realiza_limpeza_caixa_dagua} />
            <DetailRow label="Empresa Limpeza" value={item.limpeza_caixa_dagua_cnpj} />
            <DetailRow label="Frequência Limpeza" value={item.limpeza_caixa_dagua_frequencia} />

            <Text style={styles.modalSectionTitle}>Saneamento</Text>
            <DetailRow label="Caixas d'Água são Fechadas" value={item.caixas_dagua_fechadas} />
            <DetailRow label="Abastecimento de Água" value={item.abastecimento_agua} />
            <DetailRow label="Esgoto Sanitário" value={item.esgoto_sanitario} />
          </ScrollView>

          <View style={styles.modalButtonContainer}>
            <TouchableOpacity style={styles.modalDeleteButton} onPress={handleDeletePress}>
              <FontAwesome name="trash" size={18} color="#B91C1C" />
              <Text style={styles.modalDeleteButtonText}>Excluir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
              <Text style={styles.modalCloseButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function ResultadosFormulariosScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [resultados, setResultados] = useState<FormularioResultado[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FormularioResultado | null>(null);

  // (opcional) estado para paginação
  const [pagination, setPagination] = useState<{ totalItems: number; totalPages: number; currentPage: number } | null>(null);

  const fetchResultados = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/formularios`);
      if (!res.ok) throw new Error("Falha ao carregar os dados.");
      const payload: BuscarFormulariosResponse = await res.json();

      // ⬇️ pegue o array no payload.data (não o objeto inteiro)
      const arr = Array.isArray(payload?.data) ? payload.data : [];
      setResultados(arr);
      setPagination(payload?.pagination ?? null);
    } catch (err) {
      console.error("Erro ao carregar formulários:", err);
      Alert.alert("Erro", "Não foi possível carregar os resultados.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchResultados();
  }, [fetchResultados]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchResultados();
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir este registro?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              // ⚠️ Se sua API tiver outro path, ajuste aqui:
              const res = await fetch(`${API_URL}/formulario/${id}`, { method: "DELETE" });
              if (!res.ok) throw new Error("Falha ao deletar.");
              setResultados(prev => prev.filter(item => item.id !== id));
              Alert.alert("Sucesso", "Registro excluído com sucesso.");
            } catch (err) {
              console.error("Erro ao deletar:", err);
              Alert.alert("Erro", "Não foi possível excluir o registro.");
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: FormularioResultado }) => (
    <View style={styles.cardShadow}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => setSelectedItem(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <FontAwesome name="file-text-o" size={24} color="#1E3A8A" />
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>{item.pgr_razao_social || "Razão Social não informada"}</Text>
            <Text style={styles.cardSubtitle}>{item.cnpj || "CNPJ não informado"}</Text>
          </View>
          <Ionicons name="search-outline" size={24} color="#6B7280" />
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.replace("/home")} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color="#1E3A8A" />
          <Text style={styles.backText}>Home</Text>
        </TouchableOpacity>
        <Image source={require("../assets/Logo-Esticada.png")} style={styles.logo} resizeMode="contain" />
        <View style={{ width: 70 }} />
      </View>

      <View style={styles.hero}>
        <Text style={styles.headerTitle}>Resultados dos Formulários</Text>
        <Text style={styles.headerSubtitle}>Visualize os dados enviados.</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0F4C81" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={resultados}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0F4C81" />}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <FontAwesome name="inbox" size={40} color="#94a3b8" />
              <Text style={styles.emptyTitle}>Nenhum formulário</Text>
              <Text style={styles.emptySubtitle}>Ainda não há resultados para exibir.</Text>
            </View>
          )}
        />
      )}

      <DetailsModal
        visible={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
        onDelete={handleDelete}
      />
    </SafeAreaView>
  );
}

// ---- estilos (iguais ao seu código, mantive) ----
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
    flexDirection: "row",
    paddingHorizontal: 12,
  },
  logo: { width: 220, height: 50 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 4 as any, width: 70 },
  backText: { color: "#1E3A8A", fontWeight: "800" },
  hero: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#1E3A8A" },
  headerSubtitle: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  emptyContainer: { justifyContent: "center", alignItems: "center", marginTop: 80, padding: 20, backgroundColor: "#f1f5f9", borderRadius: 12 },
  emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: "600", color: "#334155" },
  emptySubtitle: { textAlign: "center", color: "#64748b" },
  cardShadow: { borderRadius: CARD_RADIUS, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4, marginBottom: 14 },
  card: { backgroundColor: "#FFFFFF", borderRadius: CARD_RADIUS, borderWidth: 1, borderColor: "#E5E7EB", padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1f2937" },
  cardSubtitle: { fontSize: 14, color: '#6B7280' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: 'white', height: '85%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 },
  modalScrollView: { paddingBottom: 80 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1E3A8A', marginBottom: 16, textAlign: 'center' },
  modalSectionTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginTop: 20, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 4 },
  detailRow: { marginBottom: 10 },
  detailLabel: { fontWeight: 'bold', color: '#4B5563', fontSize: 15, marginBottom: 2 },
  detailText: { color: '#374151', fontSize: 15, flexWrap: 'wrap' },
  jsonItemContainer: { backgroundColor: '#F3F4F6', borderRadius: 8, padding: 10, marginTop: 5 },
  jsonItemText: { color: '#374151', fontSize: 14 },
  modalButtonContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 16, paddingBottom: 24, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  modalDeleteButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEE2E2', borderRadius: 12, paddingVertical: 14, marginRight: 8 },
  modalDeleteButtonText: { color: '#B91C1C', fontSize: 16, fontWeight: '700' },
  modalCloseButton: { flex: 1, backgroundColor: '#1E3A8A', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginLeft: 8 },
  modalCloseButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
