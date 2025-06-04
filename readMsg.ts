import { useEffect, useState } from 'react';
import { BluetoothDevice, BluetoothEventSubscription } from 'react-native-bluetooth-classic';

export function useBluetoothMessages(device: BluetoothDevice | null) {
  const [messages, setMessages] = useState<string[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!device) {
      setConnected(false);
      return;
    }

    let subscription: BluetoothEventSubscription;
    let interval: NodeJS.Timeout;

    const connectAndListen = async () => {
      try {
        const isConnected = await device.isConnected();
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

        // Poll connection status every 5 seconds
        interval = setInterval(async () => {
          const stillConnected = await device.isConnected();
          setConnected(stillConnected);
        }, 5000);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    connectAndListen();

    return () => {
      subscription?.remove();
      if (interval){
        clearInterval(interval);
      }
    };
  }, [device]);

  return { messages, connected, error };
}
