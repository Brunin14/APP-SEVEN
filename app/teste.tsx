import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

export default function TesteNotificacaoPage() {
  const enviarNotificacaoLocal = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Notificação Local',
        body: 'Esta é uma notificação local só para você!',
        sound: true,
      },
      trigger: null,
    });
  };

    const enviarBroadcastGlobal = async () => {
    try {
        const response = await fetch('https://api.sevenplus-app.com.br/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title: '📣 Notificação Global',
            body: 'Todos os dispositivos receberam esta mensagem!',
        }),
        });

        if (!response.ok) throw new Error('Erro HTTP ' + response.status);

        const data = await response.json();
        Alert.alert('✅ Enviado', `Enviado para ${data.sent} dispositivos.`);
    } catch (error) {
        console.error('Erro ao enviar notificação global:', error);
        Alert.alert('❌ Erro', String(error));
    }
    };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Página de Teste</Text>
      <Button title="🔔 Notificação Local (só para mim)" onPress={enviarNotificacaoLocal} />
      <View style={{ height: 20 }} />
      <Button title="📣 Notificação Global (para todos)" onPress={enviarBroadcastGlobal} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
  },
});
