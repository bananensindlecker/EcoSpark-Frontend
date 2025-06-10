import React, { useState } from 'react';
import { View, Text, Button, TextInput, Alert, StyleSheet } from 'react-native';
import type { BluetoothDevice } from 'react-native-bluetooth-classic';
import { sendFile } from './sendFile'; // Deine sendFile.ts-Funktion
import { useBluetoothMessages } from './readMsg';

interface Props {
  connectedDevice: BluetoothDevice | null;
}

export default function FileSender({ connectedDevice }: Props) {
  const [filePath, setFilePath] = useState<string>('');
  const [fileNames, setFileNames] = useState<string[]>([]);
  const { connected, error } = useBluetoothMessages(connectedDevice);

  const handleSend = async () => {
    if (!connectedDevice || !connected) {
      Alert.alert('Kein Gerät verbunden', 'Bitte verbinde zuerst dein Bluetooth-Gerät.');
      return;
    }
    if (!filePath.trim()) {
      Alert.alert('Pfad fehlt', 'Bitte gib einen gültigen Dateipfad ein.');
      return;
    }
    try {
      await sendFile(connectedDevice, filePath.trim(), setFileNames);
      Alert.alert('Erfolg', 'Datei wurde gesendet und der Dateiname zum State hinzugefügt.');
    } catch (err) {
      Alert.alert('Fehler beim Senden', (err as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Lokaler Dateipfad:</Text>
      <TextInput
        style={styles.input}
        placeholder="/data/user/0/com.projectecospark/files/sound1.wav"
        value={filePath}
        onChangeText={setFilePath}
        autoCapitalize="none"
      />

      <Button title="Datei senden" onPress={handleSend} />

      <Text style={styles.label}>Gesendete Dateinamen:</Text>
      {fileNames.length === 0 ? (
        <Text style={styles.none}>– keine Dateien gesendet –</Text>
      ) : (
        fileNames.map((name, idx) => (
          <Text key={idx} style={styles.sent}>
            • {name}
          </Text>
        ))
      )}
      {error && <Text style={styles.error}>Bluetooth-Error: {error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { fontWeight: 'bold', marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 4,
  },
  none: {
    fontStyle: 'italic',
    marginTop: 4,
    color: '#666',
  },
  sent: {
    marginTop: 4,
  },
  error: {
    marginTop: 8,
    color: 'red',
  },
});
