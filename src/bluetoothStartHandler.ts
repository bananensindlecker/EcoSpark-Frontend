import { BluetoothDevice } from 'react-native-bluetooth-classic';
import { sendFile } from './sendFile';
import { sendMessage } from './sendMsg';
import RNFS from 'react-native-fs';

function waitForResponse(device: BluetoothDevice, expected: string, timeout = 120000): Promise<void> {
    return new Promise((resolve, reject) => {
        const subscription = device.onDataReceived((event) => {
            if (event.data?.includes(expected)) {
                subscription.remove();
                resolve();
            }
        });
        setTimeout(() => {
            subscription.remove();
            reject(new Error('Timeout waiting for response: ' + expected));
        }, timeout);
    });
}

export async function startHandler(
    device: BluetoothDevice,
    instructions: string,
    filesToSend: Array<string> = ['']
): Promise<void> {
    if (!device?.isConnected) {
        throw new Error('Device not connected');
    }
    if (!instructions) {
        throw new Error('Instructions are required');
    }
    if (filesToSend[0] !== '') {
        for (let file of filesToSend) {
            const exists = await RNFS.exists(file);
            if (!exists) {
                throw new Error(`File does not exist: ${file}`);
            }
            await sendFile(device, file).catch(error => {
                throw new Error('File send failed: ' + (error as Error).message);
            });
            const filename = file.split('/').pop();
            await waitForResponse(device, `Audio Datei gespeichet als ${filename}`);
        }
    }
    await sendMessage(device, '2' + instructions);
    return Promise.resolve();
}
