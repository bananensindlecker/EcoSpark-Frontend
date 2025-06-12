import { Button, StyleSheet, Text, View } from 'react-native';
import {connectToPi} from './connectToPi';
import { useState } from 'react';
import { BluetoothDevice } from 'react-native-bluetooth-classic';
import { useBluetoothMessages } from './readMsg';
import { startHandler } from './bluetoothStartHandler';
import { sendMessage } from './sendMsg';


export default function App() {
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice>(null as unknown as BluetoothDevice);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [message, setMessage] = useState<string>('');
  const { messages,connected} = useBluetoothMessages(connectedDevice);
  let filePath1 = '/storage/emulated/0/Download/test.wav'; // Pfad zur Audiodatei
  let filePath2 = '/storage/emulated/0/Download/test2.wav'; // Pfad zur Audiodatei
  let password = '1234'; // Passwort für die Verbindung, kann angepasst werden
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Bluetooth Verbindungs Demonstration</Text>
      <Button title="Connect to Raspberry Pi" onPress={() => connectToPi(setConnectedDevice, password,setMessage)} />
      {/*Verbindungsstatus*/}
      <Text style={styles.status}>{connected ? `Connected to ${connectedDevice.name}` : 'Not connected'}</Text>


      {/*Button zum Senden einer sequenz*/}
      <Button title="Abfolge 1 (1 Licht)" onPress={() => startHandler(connectedDevice,'light,20,0000,5000,1600',[''])} />

      {/*Button zum Senden einer sequenz*/}
      <Button title="Abfolge 2 (1 Licht)" onPress={() => startHandler(connectedDevice,'light,20,0000,5000,800',[''])} />

      {/*Button zum Senden einer sequenz*/}
      <Button title="Abfolge 3 (1 Licht)" onPress={() => startHandler(connectedDevice,'light,20,0000,5000,400',[''])} />

      {/*Button zum Senden einer sequenz*/}
      <Button title="Abfolge 4 (1 Licht)" onPress={() => startHandler(connectedDevice,'light,20,0000,5000,200',[''])} />
      <Button title="Abfolge 4 (2 Lichter)" onPress={() => startHandler(connectedDevice,'light,20/21,0000,5000,200',[''])} />
      <Button title="Abfolge 4 (2 Lichter verschoben)" onPress={() => startHandler(connectedDevice,'light,20,0000,5000,200?light,21,0200,5200,200',[''])} />

      {/*Button zum Senden einer sequenz*/}
      <Button title="Abfolge 5 (8 Lichter)" onPress={() => startHandler(connectedDevice,'light,21,0000,15000,960?light,20,0100,15100,960?light,16,0200,15200,960?light,12,0300,15300,960?light,07,0400,15400,960?light,08,0500,15500,960?light,25,0600,15600,960?light,24,0700,15700,960',[''])} />

      {/*Button zum Senden einer sequenz*/}
      <Button title="Abfolge 6 (8 Lichter)" onPress={() => startHandler(connectedDevice,'light,21,0000,5000?light,20,0100,5100?light,16,0200,5200?light,12,0300,5300?light,07,0400,5400?light,08,0500,5500?light,25,0600,5600?light,24,0700,5700',[''])} />

      <Button title="Abfolge 7 (mit sound) wählen" onPress={async () => {
        try {
           startHandler(connectedDevice,'light,20,0000,5000,200', [filePath1,filePath2]);
        } catch (error) {
          console.error('Failed to send combined command:', error);
          // Handle error appropriately
        }
      }} />

      {/*Button zum Starten der Abfolge*/}
      <Button title="Abfolge starten" onPress={() => sendMessage(connectedDevice,'4')} />
      <Button title="Abfolge stoppen" onPress={() => sendMessage(connectedDevice,'5')} />

      <Text style={styles.message}>Erhaltene Antworten: {messages}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { fontSize: 20, marginBottom: 20 ,color: 'white'},
  status: { marginTop: 20, fontSize: 16 , color: 'green'},
  message: { marginTop: 10, fontSize: 14, color: 'green' },
  button:{margin:5},
});
