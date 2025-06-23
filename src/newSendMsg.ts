import type { BluetoothDevice } from 'react-native-bluetooth-classic';

/**
 * Sendet eine Nachricht an ein verbundenes Bluetooth-Gerät.
 *
 * @param device Das Bluetooth-Gerät, an das gesendet werden soll
 * @param message Die Nachricht, die gesendet werden soll
 * @param timeout Zeitlimit in Millisekunden, bis die Nachricht als nicht gesendet gilt (Standard: 5000 ms)
 */
export async function sendMessage(
  device: BluetoothDevice,
  message: string,
  timeout = 5000
): Promise<void> {
  // Prüfen, ob ein Gerät verbunden ist
  if (!device?.isConnected) {
    throw new Error('Gerät nicht verbunden!');
  }

  try {
    // Schreibe die Nachricht mit Zeilenumbruch an das Gerät
    // Promise.race sorgt dafür, dass der Vorgang spätestens nach "timeout" abbricht
    await Promise.race([
      device.write(message + '\n'),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('Nachricht nicht gesendet (Timeout)')), timeout)
      ),
    ]);
  } catch (err) {
    // Fehler loggen und weiterwerfen, damit der Aufrufer informiert wird
    console.error('Sendefehler:', err);
    throw err;
  }
}
