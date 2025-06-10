import type { BluetoothDevice } from 'react-native-bluetooth-classic';

export async function sendMessage(device: BluetoothDevice, message: string): Promise<void> {
    if (!device?.isConnected) {
      throw new Error('Device not connected');
    }
    if (!message) {
      throw new Error('Message is required');
    }

    try {
      await device.write(message + '\n');
      return Promise.resolve();
    } catch (err) {
      throw new Error('Send failed: ' + (err as Error).message);
    }
}
