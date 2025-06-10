import type { BluetoothDevice } from 'react-native-bluetooth-classic';
import RNFS from 'react-native-fs';

export async function sendFile(
  device: BluetoothDevice,
  filePath: string,
): Promise<void> {
  console.log('Starting file transfer...');
  if (!device?.isConnected) {
  console.log('No device connected');
    throw new Error('Device not connected');
  }
  if (!filePath) {
  console.log('No file path provided');
    throw new Error('File path is required');
  }

  try {
    console.log('Starting try block');

    const fileExists = await RNFS.exists(filePath);
    console.log('File exists:', fileExists);

    if (!fileExists) {
      throw new Error('File does not exist or is not accessible: ' + filePath);
    }

    console.log('File exists, proceeding to read file');
    let fileData = '';
    try {
      fileData = await RNFS.readFile(filePath, 'base64');
      console.log('File read successfully');
    } catch (err) {
      console.log('Error reading file:', err);
      throw err;
    }

    const fileName = filePath.split(/[/\\]/).pop();
    if (!fileName) {
      throw new Error('Invalid file path: cannot extract filename');
    }
    const chunkSize = 32768;
    console.log('file sending started');
    await device.write(`3:${fileName}:START\n`);
    console.log('START command sent');


    for (let i = 0; i < fileData.length; i += chunkSize) {
      const chunk = fileData.substring(i, i + chunkSize);
      await device.write(chunk);
    }
    await device.write('\nEND\n');
    console.log('File sending finished');
    return Promise.resolve();
  } catch (err) {
    throw new Error('Send failed: ' + (err as Error).message);
  }
}
