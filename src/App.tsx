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
  let password = '15Punkte'; // Passwort für die Verbindung, kann angepasst werden
  return (
    <View style={styles.container}>

      <Text style={styles.header}>Bluetooth Verbindungs Demonstration</Text>
      <Button title="Connect to Raspberry Pi" onPress={() => connectToPi(setConnectedDevice, password,setMessage)} />
      {/*Verbindungsstatus*/}
      <Text style={styles.status}>{connected ? `Connected to ${connectedDevice.name}` : 'Not connected'}</Text>

      <Button title="Abfolge 1 Licht" onPress={() => startHandler(connectedDevice,'light,27,0,20000,100',[''])} />
      {/*Button zum Senden einer sequenz*/}
      <Button title="Abfolge welle (8 Lichter)" onPress={() => startHandler(connectedDevice,'light,21,0000,15000,960?light,20,0100,15100,960?light,16,0200,15200,960?light,12,0300,15300,960?light,07,0400,15400,960?light,08,0500,15500,960?light,25,0600,15600,960?light,24,0700,15700,960',[''])} />

      {/*Button zum Senden einer sequenz*/}
      <Button title="Abfolge an (8 Lichter)" onPress={() => startHandler(connectedDevice,'light,21,0000,5000?light,20,0100,5100?light,16,0200,5200?light,12,0300,5300?light,07,0400,5400?light,08,0500,5500?light,25,0600,5600?light,24,0700,5700',[''])} />

      <Button title="Abfolge welle (21 Lichter)" onPress={() => startHandler(connectedDevice,'light,20,0,20000,960?light,21,200,20200,960?light,16,400,20400,960?light,12,600,20600,960?light,7,800,20800,960?light,8,1000,21000,960?light,25,1200,21200,960?light,24,1400,21400,960?light,06,1600,21600,960?light,05,1800,21800,960?light,11,2000,22000,960?light,9,2200,22200,960?light,10,2400,22400,960?light,22,2600,22600,960?light,27,2800,22800,960?light,17,3000,23000,960?light,19,3200,23200,960?light,13,3400,23400,960?light,23,3600,23600,960?light,18,3800,23800,960?light,4,4000,24000,960?',[''])} />

      <Button title="Abfolge mit sound" onPress={async () => {
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
