import type { BluetoothDevice } from 'react-native-bluetooth-classic';
import RNFS from 'react-native-fs';

/**
 * Sendet eine Datei über Bluetooth an ein verbundenes Gerät.
 *
 * @param device Das Bluetooth-Gerät, an das gesendet werden soll
 * @param filePath Pfad zur Datei, die gesendet werden soll
 */
export async function sendFile(
  device: BluetoothDevice,
  filePath: string,
): Promise<void> {
  console.log('Dateiübertragung gestartet...');

  // Prüfen, ob ein Gerät verbunden ist
  if (!device?.isConnected) {
    console.log('Kein Gerät verbunden');
    throw new Error('Gerät nicht verbunden');
  }

  // Prüfen, ob ein Dateipfad übergeben wurde
  if (!filePath) {
    console.log('Kein Dateipfad übergeben');
    throw new Error('Dateipfad ist erforderlich');
  }

  try {
    console.log('Starte try-Block');

    // Prüfen, ob die Datei existiert
    const fileExists = await RNFS.exists(filePath);
    if (!fileExists) {
      throw new Error('Datei existiert nicht oder ist nicht zugänglich: ' + filePath);
    }

    let fileData = '';
    try {
      // Datei als base64 einlesen
      fileData = await RNFS.readFile(filePath, 'base64');
    } catch (err) {
      console.log('Fehler beim Lesen der Datei:', err);
      throw err;
    }

    // Dateinamen aus dem Pfad extrahieren
    const fileName = filePath.split(/[/\\]/).pop();
    if (!fileName) {
      throw new Error('Ungültiger Dateipfad: Dateiname konnte nicht extrahiert werden');
    }

    const chunkSize = 32768; // Größe der Datenpakete in Zeichen (base64 ist größer als binär)
    console.log('Dateiübertragung beginnt');

    // Sende Startsignal mit Dateinamen an das Gerät
    await device.write(`3:${fileName}:START\n`);

    // Sende Datei in einzelnen Paketen
    for (let i = 0; i < fileData.length; i += chunkSize) {
      const chunk = fileData.substring(i, i + chunkSize);
      await device.write(chunk);
    }

    // Sende Endsignal
    await device.write('\nEND\n');
    console.log('Dateiübertragung abgeschlossen');

    return Promise.resolve();
  } catch (err) {
    // Fehler behandeln
    throw new Error('Senden fehlgeschlagen: ' + (err as Error).message);
  }
}
