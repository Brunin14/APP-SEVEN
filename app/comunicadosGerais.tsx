import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

const API_BASE_URL = "https://api.sevenplus-app.com.br";

// Interface para definir a estrutura de um comunicado
interface Comunicado {
  id: number;
  titulo: string;
  corpo: string;
  created_at: string;
}

export default function ComunicadosScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Função para buscar os comunicados da API
  const fetchComunicados = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/comunicados`);
      if (!res.ok) throw new Error('Falha ao carregar os dados.');
      const data = await res.json();
      setComunicados(data);
    } catch (err) {
      console.error("Erro ao carregar comunicados:", err);
      // Alert.alert("Erro", "Não foi possível carregar os comunicados."); // Descomente se quiser um alerta
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Efeito para buscar os dados quando a tela é montada
  useEffect(() => {
    fetchComunicados();
  }, [fetchComunicados]);

  // Função para o "puxar para atualizar"
  const onRefresh = () => {
    setRefreshing(true);
    fetchComunicados();
  };
  
  // Formata a data para o padrão brasileiro
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Componente que renderiza cada item da lista
  const renderItem = ({ item }: { item: Comunicado }) => (
    <View style={styles.cardShadow}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <FontAwesome name="bullhorn" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>{item.titulo}</Text>
            <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
          </View>
        </View>
        <Text style={styles.cardBody}>{item.corpo}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      {/* Cabeçalho da Página */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color="#1E3A8A" />
          <Text style={styles.backText}>Home</Text>
        </TouchableOpacity>
        <Image source={require("../assets/Logo-Esticada.png")} style={styles.logo} resizeMode="contain" />
        <View style={{ width: 70 }} />
      </View>

      {/* Título da Seção */}
      <View style={styles.hero}>
        <Text style={styles.headerTitle}>Mural de Comunicados</Text>
        <Text style={styles.headerSubtitle}>Fique por dentro das últimas novidades.</Text>
      </View>

      {/* Lista de Comunicados */}
      {loading ? (
        <ActivityIndicator size="large" color="#0F4C81" style={{ marginTop: 20 }}/>
      ) : (
        <FlatList
          data={comunicados}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0F4C81"/>}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <FontAwesome name="inbox" size={40} color="#94a3b8" />
              <Text style={styles.emptyTitle}>Nenhum comunicado</Text>
              <Text style={styles.emptySubtitle}>Ainda não há comunicados para exibir.</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F3F4F6" },
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
  logo: { width: 180, height: 40 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 4, width: 70 },
  backText: { color: "#1E3A8A", fontWeight: "600", fontSize: 16 },
  hero: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#1E3A8A" },
  headerSubtitle: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  emptyContainer: { justifyContent: "center", alignItems: "center", marginTop: 80, padding: 20 },
  emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: "600", color: "#334155" },
  emptySubtitle: { textAlign: "center", color: "#64748b" },
  cardShadow: { 
    borderRadius: 16, 
    shadowColor: "#000", 
    shadowOpacity: 0.08, 
    shadowRadius: 10, 
    shadowOffset: { width: 0, height: 4 }, 
    elevation: 3, 
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  card: { 
    backgroundColor: "#FFFFFF", 
    borderRadius: 16, 
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F4C81',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: { 
    fontSize: 17, 
    fontWeight: "700", 
    color: "#1f2937" 
  },
  cardDate: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  cardBody: {
    fontSize: 15,
    color: '#374151',
    padding: 16,
    lineHeight: 22,
  },
});
