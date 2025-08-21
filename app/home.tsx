// app/home.tsx
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { canAccess } from "../constants/access";

const API_BASE_URL = "https://api.sevenplus-app.com.br";

// --- Tipos ---
type MenuButtonProps = {
  href: string;
  title: string;
  subtitle: string;
  color: string;
  icon: React.ReactNode;
};

interface Ferias {
  id: number;
  periodo_aquisitivo_inicio: string;
  periodo_aquisitivo_fim: string;
  periodo_gozo_inicio: string;
  periodo_gozo_fim: string;
}

interface Holerite {
  id: number;
  mes_referencia: string;
  url_download: string;
}

// --- Componentes auxiliares ---
const MenuButton = ({ href, title, subtitle, color, icon }: MenuButtonProps) => {
  const btnStyle = StyleSheet.flatten([styles.menuButton, { shadowColor: color }]);
  return (
    <Link href={href as any} asChild>
      <Pressable style={btnStyle}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>{icon}</View>
        <View style={styles.menuTextWrap}>
          <Text style={styles.menuTitle}>{title}</Text>
          <Text style={styles.menuSubtitle}>{subtitle}</Text>
        </View>
        <FontAwesome name="chevron-right" size={18} color="#D1D5DB" />
      </Pressable>
    </Link>
  );
};

const FeriasModal = ({
  isOpen,
  onClose,
  userName,
  token,
}: {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  token: string;
}) => {
  const [feriasItems, setFeriasItems] = useState<Ferias[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) fetchFerias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchFerias = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ferias/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Não foi possível buscar os dados de férias.");
      }
      setFeriasItems(data.items || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  const getReturnDate = (gozoFim: string) => {
    if (!gozoFim) return "N/A";
    const [year, month, day] = gozoFim.split("-").map(Number);
    const endDate = new Date(year, month - 1, day);
    endDate.setDate(endDate.getDate() + 1);
    const returnDay = String(endDate.getDate()).padStart(2, "0");
    const returnMonth = String(endDate.getMonth() + 1).padStart(2, "0");
    const returnYear = endDate.getFullYear();
    return `${returnDay}/${returnMonth}/${returnYear}`;
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Férias de {userName.split(" ")[0]}</Text>
          <View style={styles.feriasListContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#1E3A8A" />
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : feriasItems.length > 0 ? (
              <ScrollView>
                {feriasItems.map((item) => (
                  <View key={item.id} style={styles.feriasItem}>
                    <Text style={styles.feriasTitle}>Período de Gozo:</Text>
                    <Text style={styles.feriasDate}>
                      {formatDate(item.periodo_gozo_inicio)} até {formatDate(item.periodo_gozo_fim)}
                    </Text>
                    <Text style={[styles.feriasTitle, { marginTop: 8 }]}>Data de Retorno:</Text>
                    <Text style={styles.feriasDate}>{getReturnDate(item.periodo_gozo_fim)}</Text>
                    <Text style={styles.feriasSubtitle}>
                      Aquisitivo: {formatDate(item.periodo_aquisitivo_inicio)} a{" "}
                      {formatDate(item.periodo_aquisitivo_fim)}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.noDataText}>Nenhum registro de férias encontrado.</Text>
            )}
          </View>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Text style={styles.modalCloseButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const HoleritesModal = ({
  isOpen,
  onClose,
  userName,
  token,
}: {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  token: string;
}) => {
  const [holerites, setHolerites] = useState<Holerite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) fetchHolerites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchHolerites = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/meus-olerites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Não foi possível buscar os holerites.");
      }
      setHolerites(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (downloadUrl: string) => {
    const fullUrl = `${API_BASE_URL}/${downloadUrl}`;
    const supported = await Linking.canOpenURL(fullUrl);
    if (supported) {
      await Linking.openURL(fullUrl);
    } else {
      Alert.alert("Erro", `Não é possível abrir o link: ${fullUrl}`);
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Holerites de {userName.split(" ")[0]}</Text>
          <View style={styles.feriasListContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#1E3A8A" />
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : holerites.length > 0 ? (
              <ScrollView>
                {holerites.map((item) => (
                  <View key={item.id} style={styles.holeriteItem}>
                    <View style={styles.holeriteInfo}>
                      <FontAwesome name="file-pdf-o" size={24} color="#1E3A8A" />
                      <Text style={styles.holeriteMonth}>{item.mes_referencia}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.downloadButton}
                      onPress={() => handleDownload(item.url_download)}
                    >
                      <Text style={styles.downloadButtonText}>Baixar</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.noDataText}>Nenhum holerite encontrado.</Text>
            )}
          </View>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Text style={styles.modalCloseButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// --- Tela principal ---
export default function HomeScreen() {
  const { user, token, signOut } = useAuth() as any;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [isProfileModalVisible, setProfileModalVisible] = useState(false);
  const [isFeriasModalVisible, setFeriasModalVisible] = useState(false);
  const [isHoleritesModalVisible, setHoleritesModalVisible] = useState(false);

  const profileImageUrl = user?.foto_perfil_url ? `${API_BASE_URL}/${user.foto_perfil_url}?t=${Date.now()}` : null;

  async function handleLogout() {
    try {
      await signOut();
    } finally {
      setProfileModalVisible(false);
      router.replace("/login");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.topBar, { paddingTop: insets.top + 16 }]}>
        <View style={{ width: 50 }} />
        <Image source={require("../assets/Logo-Esticada.png")} style={styles.logo} contentFit="contain" />
        <TouchableOpacity style={styles.profileButton} onPress={() => setProfileModalVisible(true)}>
          {profileImageUrl ? (
            <Image source={{ uri: profileImageUrl }} style={styles.profileImageHeader} />
          ) : (
            <FontAwesome name="user-circle" size={32} color="#1E3A8A" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.welcomeBlock}>
          <Text style={styles.welcomeTitle}>Bem-vindo{user?.nome ? `, ${user.nome.split(" ")[0]}` : ""}!</Text>
          <Text style={styles.welcomeSubtitle}>Gerencie tudo em um só lugar</Text>
        </View>

        <View style={styles.menuList}>
          {canAccess(user, "/comunicados") && (
            <MenuButton
              href="/comunicados"
              title="Mural de Comunicados"
              subtitle="Anúncios importantes do RH"
              color="#0F4C81"
              icon={<FontAwesome name="bullhorn" size={24} color="#FFFFFF" />}
            />
          )}

          {canAccess(user, "/ListaDeComprasScreen") && (
            <MenuButton
              href="/ListaDeComprasScreen"
              title="Lista de Compras"
              subtitle="Itens para Galpão, Arca e Escritório"
              color="#0F4C81"
              icon={<MaterialCommunityIcons name="clipboard-list-outline" size={24} color="#FFFFFF" />}
            />
          )}

          {canAccess(user, "/resultados-formularios") && (
            <MenuButton
              href="/resultados-formularios"
              title="Formulários"
              subtitle="Veja os formulários já enviados"
              color="#0F4C81"
              icon={<MaterialCommunityIcons name="file-chart-outline" size={24} color="#FFFFFF" />}
            />
          )}

          {canAccess(user, "/comunicadosGerais") && (
            <MenuButton
              href="/comunicadosGerais"
              title="Comunicados Gerais"
              subtitle="Comunicados Enviados"
              color="#0F4C81"
              icon={<MaterialCommunityIcons name="file-chart-outline" size={24} color="#FFFFFF" />}
            />
          )}

          {canAccess(user, "/ver-atestados") && (
            <MenuButton
              href="/ver-atestados"
              title="Ver Atestados"
              subtitle="Visualize e gerencie os atestados"
              color="#0F4C81"
              icon={<MaterialCommunityIcons name="file-check-outline" size={24} color="#FFFFFF" />}
            />
          )}

          {canAccess(user, "/AtestadoScreen") && (
            <MenuButton
              href="/AtestadoScreen"
              title="Enviar Atestado ou Declaração de horas"
              subtitle="Envie seu documento para o RH"
              color="#0F4C81"
              icon={<MaterialCommunityIcons name="newspaper-variant-outline" size={24} color="#FFFFFF" />}
            />
          )}

          {canAccess(user, "/copy-hub") && (
            <MenuButton
              href="/copy-hub"
              title="Central de Copys"
              subtitle="Gerencie as Copys de Marketing"
              color="#0F4C81"
              icon={<MaterialCommunityIcons name="pencil-outline" size={24} color="#FFFFFF" />}
            />
          )}
        </View>
      </ScrollView>

      {/* Modal de Perfil */}
      <Modal
        visible={isProfileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Meu Perfil</Text>

            <View style={styles.profilePictureContainer}>
              {profileImageUrl ? (
                <Image source={{ uri: profileImageUrl }} style={styles.profileImageModal} />
              ) : (
                <FontAwesome name="user-circle" size={80} color="#D1D5DB" />
              )}
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={() => setFeriasModalVisible(true)}>
              <FontAwesome name="calendar-check-o" size={20} color="#1F2937" />
              <Text style={styles.modalButtonText}>Minhas Férias</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalButton} onPress={() => setHoleritesModalVisible(true)}>
              <FontAwesome name="file-text-o" size={20} color="#1F2937" />
              <Text style={styles.modalButtonText}>Meus Holerites</Text>
            </TouchableOpacity>

            {/* Botão SAIR */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <FontAwesome name="sign-out" size={18} color="#fff" />
              <Text style={styles.logoutButtonText}>Sair</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setProfileModalVisible(false)}>
              <Text style={styles.modalCloseButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Férias */}
      {user && (
        <FeriasModal
          isOpen={isFeriasModalVisible}
          onClose={() => setFeriasModalVisible(false)}
          userName={user.nome}
          token={token}
        />
      )}

      {/* Modal de Holerites */}
      {user && (
        <HoleritesModal
          isOpen={isHoleritesModalVisible}
          onClose={() => setHoleritesModalVisible(false)}
          userName={user.nome}
          token={token}
        />
      )}
    </SafeAreaView>
  );
}

const CARD_RADIUS = 20;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#E5E5E5" },
  topBar: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 16,
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  logo: { width: 220, height: 60 },
  profileButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  profileImageHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  welcomeBlock: {
    backgroundColor: "#E5E5E5",
    paddingTop: 20,
    paddingBottom: 14,
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1E3A8A",
  },
  welcomeSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#6B7280",
  },
  menuList: {
    marginTop: 16,
    gap: 16 as any,
    paddingBottom: 8,
  },
  menuButton: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuTextWrap: { flex: 1 },
  menuTitle: { fontSize: 18, fontWeight: "800", color: "#1F2937" },
  menuSubtitle: { marginTop: 4, fontSize: 13, color: "#6B7280" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E3A8A",
    marginBottom: 20,
  },
  profilePictureContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  profileImageModal: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
    width: "100%",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  // Botão SAIR
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#B91C1C",
    padding: 14,
    borderRadius: 12,
    marginTop: 4,
    width: "100%",
    justifyContent: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  modalCloseButton: {
    backgroundColor: "#6B7280",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
    width: "100%",
  },
  modalCloseButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  feriasListContainer: {
    width: "100%",
    maxHeight: 300,
    marginBottom: 20,
  },
  feriasItem: {
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  feriasTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  feriasDate: {
    fontSize: 16,
    color: "#1E3A8A",
    fontWeight: "500",
    marginTop: 2,
  },
  feriasSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
  },
  errorText: {
    textAlign: "center",
    color: "#EF4444",
  },
  noDataText: {
    textAlign: "center",
    color: "#6B7280",
  },
  holeriteItem: {
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  holeriteInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  holeriteMonth: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  downloadButton: {
    backgroundColor: "#1E3A8A",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  downloadButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
