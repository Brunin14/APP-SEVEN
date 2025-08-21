import React, { useEffect, useRef } from "react";
import { Alert, Platform, ActivityIndicator, View, StyleSheet } from "react-native";
import { Slot, usePathname, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { canAccess } from "../constants/access";
import { Image } from "expo-image";
import { SafeAreaProvider } from "react-native-safe-area-context";

// --- TELA DE SPLASH ---
function SplashScreen() {
  return (
    <View style={styles.splashContainer}>
      <Image
        source={require('../assets/Logo-Esticada.png')}
        style={styles.logo}
        contentFit="contain"
      />
      <ActivityIndicator size="large" color="#FFFFFF" style={{ marginTop: 20 }} />
    </View>
  );
}

// --- CONFIGURAÇÃO DE NOTIFICAÇÕES ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// --- LAYOUT PRINCIPAL ---
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationsGate>
          <AppRoutesGuard>
            <Slot />
          </AppRoutesGuard>
        </NotificationsGate>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

// --- GUARDIÃO DE ROTAS ---
function AppRoutesGuard({ children }: { children: React.ReactNode }) {
  const { user, token, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const lastRedirect = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;
    const isAuthed = !!token && !!user;
    const isLogin = pathname === "/login";

    if (!isAuthed && !isLogin) {
      if (lastRedirect.current !== "/login") {
        lastRedirect.current = "/login";
        router.replace("/login");
      }
      return;
    }

    if (isAuthed && isLogin) {
      if (lastRedirect.current !== "/home") {
        lastRedirect.current = "/home";
        router.replace("/home");
      }
      return;
    }

    if (isAuthed) {
      const allowed = canAccess(user, pathname);
      if (!allowed) {
        if (lastRedirect.current !== "/home") {
          lastRedirect.current = "/home";
          router.replace("/home");
        }
        return;
      }
    }
    lastRedirect.current = null;
  }, [loading, token, user, pathname]);

  if (loading) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}

// --- GATE DE NOTIFICAÇÕES (COM ALTERAÇÕES) ---
function NotificationsGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter(); // Adicionado para navegação
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
        sound: "default",
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function setup() {
      if (!user || Platform.OS === "web") return;
      const token = await registerForPushNotificationsAsync();
      if (!mounted || !token) return;

      try {
        await fetch("https://api.sevenplus-app.com.br/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, expoPushToken: token, platform: Platform.OS }),
        });
        console.log("📲 Token enviado para o backend:", token);
      } catch (err) {
        console.error("❌ Erro ao enviar token:", err);
      }
    }
    setup();
    return () => { mounted = false; };
  }, [user]);

  useEffect(() => {
    if (Platform.OS === "web") return;

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      const c = notification.request.content;
      if (c?.title || c?.body) {
        Alert.alert(c.title || "Notificação", c.body || "");
      }
    });

    // CORRIGIDO: Adicionada a lógica de navegação
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("📨 Usuário clicou na notificação:", response);
      // Navega para a tela de comunicados
      router.push('/comunicadosGerais'); 
    });

    return () => {
      // CORRIGIDO: Usando o método .remove() para evitar o aviso de depreciação
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router]); // Adicionado router como dependência

  return <>{children}</>;
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    Alert.alert("Erro", "Use em um dispositivo físico!");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    Alert.alert("Permissão negada!", "Não foi possível ativar notificações.");
    return null;
  }
  const projectId =
    (Constants?.expoConfig as any)?.extra?.eas?.projectId ||
    (Constants as any)?.easConfig?.projectId;

  const token = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );
  return token.data;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F4C81',
  },
  logo: {
    width: 280,
    height: 80,
  },
});
