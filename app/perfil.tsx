import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; // Importação completa

const API_BASE_URL = "https://api.sevenplus-app.com.br";

export default function PerfilScreen() {
  const { user, token, updateUser } = useAuth() as any;
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  const handleImagePick = async (useCamera: boolean) => {
    let result;
    // CORRIGIDO: Uso de ImagePicker.MediaType.Images
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    };

    try {
      if (useCamera) {
        await ImagePicker.requestCameraPermissionsAsync();
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Erro", "Não foi possível acessar a câmera ou galeria.");
    }
  };

  const uploadImage = async (uri: string) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('foto_perfil', {
      uri,
      name: `profile_${user?.id}.jpg`,
      type: 'image/jpeg',
    } as any);

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/photo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao enviar a imagem.');

      if (updateUser) {
        updateUser({ ...user, foto_perfil_url: data.foto_perfil_url });
      }
      Alert.alert('Sucesso', 'Foto de perfil atualizada!');
    } catch (error: any) {
      Alert.alert('Erro no Upload', error.message);
    } finally {
      setUploading(false);
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert("Alterar Foto", "Escolha uma opção:", [
      { text: "Tirar Foto", onPress: () => handleImagePick(true) },
      { text: "Escolher da Galeria", onPress: () => handleImagePick(false) },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.screen}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  const profileImageUrl = user.foto_perfil_url
    ? `${API_BASE_URL}/${user.foto_perfil_url}?t=${Date.now()}`
    : null;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.profileContainer}>
        <TouchableOpacity style={styles.avatarContainer} onPress={showImagePickerOptions}>
          {uploading ? (
            <ActivityIndicator size="large" />
          ) : profileImageUrl ? (
            <Image source={{ uri: profileImageUrl }} style={styles.avatar} />
          ) : (
            <FontAwesome name="user-circle" size={120} color="#D1D5DB" />
          )}
          <View style={styles.cameraIconOverlay}>
            <FontAwesome name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.userName}>{user.nome || 'Nome do Usuário'}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert("Em breve", "Funcionalidade de férias em desenvolvimento.")}>
          <FontAwesome name="calendar-check-o" size={22} color="#1F2937" />
          <Text style={styles.actionButtonText}>Minhas Férias</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert("Em breve", "Funcionalidade de holerites em desenvolvimento.")}>
          <FontAwesome name="file-text-o" size={22} color="#1F2937" />
          <Text style={styles.actionButtonText}>Meus Holerites</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  backButton: {
    padding: 8,
  },
  profileContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1E3A8A',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  actionsContainer: {
    paddingHorizontal: 24,
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 16,
  },
});
