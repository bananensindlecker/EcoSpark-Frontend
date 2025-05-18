import { useEffect, useState } from 'react';
import {BluetoothDevice, BluetoothEventSubscription} from 'react-native-bluetooth-classic';

export function useBluetoothMessages(device: BluetoothDevice | null) {
  const [messages, setMessages] = useState<string[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!device) {return;}

    let subscription: BluetoothEventSubscription;

    const connectAndListen = async () => {
      try {
        const isConnected = await device.connect();
        setConnected(isConnected);

        if (!isConnected) {
          setError('Failed to connect to the device.');
          return;
        }

        // Subscribe to incoming Bluetooth data
        subscription = device.onDataReceived((event) => {
          const incoming = event.data?.trim();
          if (incoming) {
            setMessages((prev) => [...prev, incoming]);
          }
        });
      } catch (err) {
        setError((err as Error).message);
      }
    };

    connectAndListen();

    return () => {
      subscription?.remove(); // Clean up listener
    };
  }, [device]);

  return { messages, connected, error };
}
