import type { BluetoothDevice } from 'react-native-bluetooth-classic';

export async function sendMessage(device: BluetoothDevice, message: string): Promise<void> {
    if (!device?.isConnected) {
      throw new Error('Device not connected');
    }

    try {
      await device.write(message + '\n');
    } catch (err) {
      throw new Error('Send failed: ' + (err as Error).message);
    }
}

