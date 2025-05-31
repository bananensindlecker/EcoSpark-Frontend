import { Button, StyleSheet, Text, View } from 'react-native';
import {connectToPi} from './communicateWithPi';
import { useState } from 'react';
import { BluetoothDevice } from 'react-native-bluetooth-classic';
import { useBluetoothMessages } from './readMsg';
import { sendMessage } from './sendMsg';
import { sendFile } from './sendFile';


export default function App() {
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice>(null as unknown as BluetoothDevice);
  const [message, setMessage] = useState<string>('');
  const { messages,error} = useBluetoothMessages(connectedDevice);
  let filePath = '/storage/emulated/0/Download/test.wav'; // Pfad zur Audiodatei
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Bluetooth Classic Example</Text>
      <Button title="Connect to Raspberry Pi" onPress={() => connectToPi(setConnectedDevice, setMessage)} />
      {/*Verbindungsstatus*/}
      <Text style={styles.status}>{connectedDevice ? `Connected to ${connectedDevice.name}` : 'Not connected'}</Text>

      {/*Error bei verbinden*/}
      <Text style={styles.message}>{message}</Text>

      {/*Button zum Senden eines tests*/}
      <Button title="Test" onPress={() => sendMessage(connectedDevice,'1')} />

      {/*Button zum Senden einer sequenz*/}
      <Button title="Abfolge senden" onPress={() => sendMessage(connectedDevice,'2light,20,0000,2000,100?sound,32837872.wav,1000,100')} />

      {/*Button zum Senden einer Audiodatei*/}
      <Button title="Datei senden" onPress={() => sendFile(connectedDevice,filePath)} />

      {/*Button zum Starten der Abfolge*/}
      <Button title="Abfolge starten" onPress={() => sendMessage(connectedDevice,'4')} />


      <Text style={styles.message}>Erhaltene Antworten: {messages}</Text>
      <Text style={styles.message}>Erhaltene Errors: {error}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { fontSize: 24, marginBottom: 20 ,color: 'white'},
  status: { marginTop: 20, fontSize: 16 , color: 'green'},
  message: { marginTop: 10, fontSize: 14, color: 'green' },
});
