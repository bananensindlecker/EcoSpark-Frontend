import { PermissionsAndroid, Platform } from 'react-native';
import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic';
import { sendMessage } from './sendMsg';

export async function connectToPi(
  setConnectedDevice: (device: BluetoothDevice) => void,
  setMessage: (message: string) => void
    ): Promise<void> {
    try {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
    }

    const devices = await RNBluetoothClassic.getBondedDevices();
    const pi = devices.find(
      d => d.name?.toLowerCase().includes('raspberry') || d.address.startsWith('B8:27:EB')
    );

    if (!pi) {
      setMessage('Pi not found. Make sure it is paired.');
      return;
    }

    const connected = await pi.connect();
    if (connected) {
      setConnectedDevice(pi);

      await sendMessage(pi, 'Hello from RN app');
    } else {
      setMessage('Failed to connect.');
    }
  } catch (err) {
    console.error(err);
    setMessage('Error: ' + (err as Error).message);
  }
}
