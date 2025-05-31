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

    const newFileName = filePath.split(/[/\\]/).pop();
    if (!newFileName) {
      throw new Error('Invalid file path: cannot extract filename');
    }
    console.log('filename is: ' + newFileName);

    const chunkSize = 32768;
    console.log('Writing START command');
    await device.write(`3:${newFileName}:START\n`);
    console.log('START command sent');


    for (let i = 0; i < fileData.length; i += chunkSize) {
      console.log(`Sending chunk ${i}`);
      const chunk = fileData.substring(i, i + chunkSize);
      await device.write(chunk);
    }
    console.log('Writing END command');
    await device.write('\nEND\n');
    console.log('File sent successfully');
    return;
  } catch (err) {
    throw new Error('Send failed: ' + (err as Error).message);
  }
}
