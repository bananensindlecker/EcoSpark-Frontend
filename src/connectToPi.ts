import { PermissionsAndroid, Platform } from 'react-native';
import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic';
import { sendMessage } from './sendMsg.ts';
import { sha3_256 } from 'js-sha3';

export async function connectToPi(
  setConnectedDevice: (device: BluetoothDevice) => void,
  password: string,
  setMessage: (message: string) => void
    ): Promise<void> {
    try {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    ];
    if (Platform.Version as number >= 31) {
      permissions.push(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
      );
    }
    const granted = await PermissionsAndroid.requestMultiple(permissions);
    console.log('Permission results:', granted);
      const allGranted = Object.values(granted).every(
        permission => permission === PermissionsAndroid.RESULTS.GRANTED
      );
      if (!allGranted) {
        setMessage('Bluetooth permissions are required to connect.');
        return;
      }
    if (!password){
      setMessage('Password is required.');
      return;
    }
    let hashedPassword = sha3_256.create().update(password).hex();

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

      await sendMessage(pi, '0' + hashedPassword);
    } else {
      setMessage('Failed to connect.');
    }
  } catch (err) {
    console.error(err);
    setMessage('Error: ' + (err as Error).message);
  }
}
