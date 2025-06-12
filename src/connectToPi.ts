import { PermissionsAndroid, Platform } from 'react-native';
import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic';
import { sendMessage } from './sendMsg.ts';

export async function connectToPi(
  setConnectedDevice: (device: BluetoothDevice) => void,
  password: string,
  setMessage: (message: string) => void
    ): Promise<void> {
    try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ]);
      const allGranted = Object.values(granted).every(
        permission => permission === PermissionsAndroid.RESULTS.GRANTED
      );
      if (!allGranted) {
        setMessage('Bluetooth permissions are required to connect.');
        return;
      }
    }
    if (!password){
      setMessage('Password is required.');
      return;
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

      await sendMessage(pi, '0' + password);
    } else {
      setMessage('Failed to connect.');
    }
  } catch (err) {
    console.error(err);
    setMessage('Error: ' + (err as Error).message);
  }
}
