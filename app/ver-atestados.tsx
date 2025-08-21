// app/ver-atestados.tsx
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
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const API_BASE_URL = "https://api.sevenplus-app.com.br";

type Atestado = {
  id: number;
  nome_completo: string;
  caminho_foto: string;
  data_envio: string;
  status: "Pendente" | "Visto" | "Aprovado" | "Recusado" | string;
};

// Componente do Modal para exibir a imagem do atestado
const AtestadoModal = ({ visible, onClose, item, onDelete }: {
  visible: boolean;
  onClose: () => void;
  item: Atestado | null;
  onDelete: (id: number) => void;
}) => {
  if (!item) return null;

  const imageUrl = `${API_BASE_URL}/${item.caminho_foto.replace(/\\/g, '/')}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{item.nome_completo}</Text>
          <Image source={{ uri: imageUrl }} style={styles.modalImage} resizeMode="contain" />
          
          <TouchableOpacity style={styles.deleteBtn} onPress={() => { onClose(); onDelete(item.id); }}>
            <Ionicons name="trash-outline" size={18} color="#B91C1C" />
            <Text style={styles.deleteBtnText}>Excluir Atestado</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Text style={styles.modalCloseButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function VerAtestadosScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [atestados, setAtestados] = useState<Atestado[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAtestado, setSelectedAtestado] = useState<Atestado | null>(null);

  const fetchAtestados = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/atestados`);
      if (!res.ok) throw new Error("Falha ao carregar os dados.");
      const data = await res.json();
      setAtestados(data);
    } catch (err) {
      console.error("Erro ao carregar atestados:", err);
      Alert.alert("Erro", "Não foi possível carregar os atestados.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAtestados();
  }, [fetchAtestados]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAtestados();
  };

  const handleOpenAtestado = async (item: Atestado) => {
    setSelectedAtestado(item); // Abre o modal imediatamente

    // Se o status for "Pendente", atualiza para "Visto"
    if (item.status.toLowerCase() === 'pendente') {
      // Atualiza a UI otimisticamente para uma resposta rápida
      setAtestados(prev =>
        prev.map(atestado =>
          atestado.id === item.id ? { ...atestado, status: 'Visto' } : atestado
        )
      );

      // Envia a atualização para o backend
      try {
        // NOTA: Certifique-se de que esta rota PUT exista no seu backend!
        await fetch(`${API_BASE_URL}/api/atestados/${item.id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Visto' })
        });
      } catch (err) {
        console.error("Erro ao atualizar status para 'Visto':", err);
        // Em caso de erro, reverte a mudança na UI
        setAtestados(prev =>
          prev.map(atestado =>
            atestado.id === item.id ? { ...atestado, status: 'Pendente' } : atestado
          )
        );
        Alert.alert("Erro", "Não foi possível marcar o atestado como visto.");
      }
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert("Confirmar Exclusão", "Deseja excluir este atestado permanentemente?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          // NOTA: Certifique-se de que esta rota DELETE exista no seu backend!
          try {
            const res = await fetch(`${API_BASE_URL}/api/atestados/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Falha ao deletar.");
            setAtestados(prev => prev.filter(item => item.id !== id));
            Alert.alert("Sucesso", "Atestado excluído.");
          } catch (err) {
            Alert.alert("Erro", "Não foi possível excluir o atestado.");
          }
        },
      },
    ]);
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aprovado': return { backgroundColor: '#22C55E', color: '#fff' };
      case 'recusado': return { backgroundColor: '#EF4444', color: '#fff' };
      case 'visto': return { backgroundColor: '#3B82F6', color: '#fff' }; // Azul para "Visto"
      default: return { backgroundColor: '#F97316', color: '#fff' }; // Laranja para "Pendente"
    }
  };

  const renderItem = ({ item }: { item: Atestado }) => {
    const statusStyle = getStatusStyle(item.status);
    return (
      <View style={styles.cardShadow}>
        <TouchableOpacity style={styles.card} onPress={() => handleOpenAtestado(item)} activeOpacity={0.8}>
          <View style={styles.cardHeader}>
            <Ionicons name="medkit-outline" size={24} color="#1E3A8A" />
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>{item.nome_completo}</Text>
              <Text style={styles.cardSubtitle}>
                Enviado em: {new Date(item.data_envio).toLocaleDateString('pt-BR')}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
              <Text style={[styles.statusBadgeText, { color: statusStyle.color }]}>{item.status || 'Pendente'}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>Atestados Recebidos</Text>
        <Text style={styles.headerSubtitle}>Visualize e gerencie os atestados enviados.</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0F4C81" style={{ marginTop: 20 }}/>
      ) : (
        <FlatList
          data={atestados}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0F4C81"/>}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <FontAwesome name="inbox" size={40} color="#94a3b8" />
              <Text style={styles.emptyTitle}>Nenhum atestado</Text>
              <Text style={styles.emptySubtitle}>Ainda não há atestados para exibir.</Text>
            </View>
          )}
        />
      )}
      
      <AtestadoModal 
        visible={!!selectedAtestado} 
        onClose={() => setSelectedAtestado(null)} 
        item={selectedAtestado}
        onDelete={handleDelete}
      />
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
  statusBadge: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContainer: { backgroundColor: 'white', borderRadius: 20, padding: 20, width: '100%', maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E3A8A', marginBottom: 16, textAlign: 'center' },
  modalImage: { width: '100%', height: 350, borderRadius: 12, backgroundColor: '#f0f0f0', marginBottom: 16 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, backgroundColor: "#FEE2E2", paddingVertical: 12, borderRadius: 10 },
  deleteBtnText: { color: '#B91C1C', fontWeight: '700', fontSize: 16 },
  modalCloseButton: { backgroundColor: '#6B7280', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  modalCloseButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
