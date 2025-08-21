// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "https://api.sevenplus-app.com.br";

// Tipo do Utilizador (inclui a foto de perfil)
type User = {
  id: number;
  nome: string;
  role?: string;
  email?: string;
  foto_perfil_url?: string;
};

// Tipo do Contexto (inclui a função para atualizar o utilizador)
type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, senha: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (newUserData: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  updateUser: () => {},
});

// Função reutilizável para buscar o perfil do utilizador a partir de um token
const fetchUserProfile = async (token: string): Promise<User> => {
    const profileRes = await fetch(`${API_BASE}/api/user/me`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    // CORRIGIDO: Adicionado log de erro detalhado
    if (!profileRes.ok) {
        const errorBody = await profileRes.text();
        console.error("Erro da API ao buscar perfil:", {
            status: profileRes.status,
            body: errorBody,
        });
        throw new Error(`Token inválido ou expirado (Status: ${profileRes.status}).`);
    }

    const profileData = await profileRes.json();
    
    // Converte os dados da API para o formato do nosso tipo User
    return {
        id: profileData.id,
        nome: profileData.name, 
        email: profileData.email,
        role: profileData.role,
        foto_perfil_url: profileData.foto_perfil_url,
    };
};


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Efeito para carregar a sessão ao iniciar a aplicação
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("auth_token");
        if (storedToken) {
          // Se encontrarmos um token, buscamos os dados mais recentes do servidor
          const userProfile = await fetchUserProfile(storedToken);
          setUser(userProfile);
          setToken(storedToken);
          // Atualizamos o AsyncStorage com os dados mais recentes
          await AsyncStorage.setItem("auth_user", JSON.stringify(userProfile));
        }
      } catch (error) {
        console.error("Falha ao carregar sessão, fazendo logout:", error);
        // Se o token for inválido, limpamos tudo
        await signOut();
      } finally {
        setLoading(false);
      }
    };
    loadUserFromStorage();
  }, []);

  // Função de Login
  async function signIn(email: string, senha: string) {
    const res = await fetch(`${API_BASE}/api/usuarios/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: senha }),
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || "Falha no login");
    }

    const data = await res.json();
    const tok: string = data.token;

    // Após o login, usamos a nossa função para buscar o perfil completo
    const userProfile = await fetchUserProfile(tok);

    await AsyncStorage.setItem("auth_token", tok);
    await AsyncStorage.setItem("auth_user", JSON.stringify(userProfile));
    setToken(tok);
    setUser(userProfile);
  }

  async function signOut() {
    await AsyncStorage.multiRemove(["auth_token", "auth_user"]);
    setToken(null);
    setUser(null);
  }

  // Função para atualizar o utilizador (ex: após trocar a foto)
  const updateUser = async (newUserData: Partial<User>) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      const updatedUser = { ...currentUser, ...newUserData };
      AsyncStorage.setItem("auth_user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  // IMPORTANTE: As suas telas (como a HomeScreen) devem verificar o estado 'loading'.
  // Enquanto 'loading' for true, mostre um indicador de carregamento para evitar
  // mostrar dados antigos antes do logout ser concluído.
  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
