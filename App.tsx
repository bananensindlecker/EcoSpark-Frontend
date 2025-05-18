import { Button, StyleSheet, Text, View } from 'react-native';
import {connectToPi} from './communicateWithPi';
import { useState } from 'react';
import { BluetoothDevice } from 'react-native-bluetooth-classic';
import { useBluetoothMessages } from './readMsg';
import { sendMessage } from './sendMsg';


export default function App() {
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice>(null as unknown as BluetoothDevice);
  const [message, setMessage] = useState<string>('');
  const { messages, connected, error} = useBluetoothMessages(connectedDevice);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Bluetooth Classic Example</Text>
      <Button title="Connect to Raspberry Pi" onPress={() => connectToPi(setConnectedDevice, setMessage)} />
      <Text style={styles.status}>
        {connectedDevice ? `Connected to ${connectedDevice.name}` : 'Not connected'}
      </Text>
      <Text style={styles.message}>{message}</Text>
      <Button title="Test" onPress={() => sendMessage(connectedDevice,'Test')} />
      <Text style={styles.message}>{...messages}</Text>
      <Text style={styles.message}>{connected}</Text>
      <Text style={styles.message}>{error}</Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { fontSize: 24, marginBottom: 20 },
  status: { marginTop: 20, fontSize: 16 },
  message: { marginTop: 10, fontSize: 14, color: 'green' },
});
