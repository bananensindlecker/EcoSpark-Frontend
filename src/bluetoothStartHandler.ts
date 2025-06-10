import { BluetoothDevice } from 'react-native-bluetooth-classic';
import { sendFile } from './sendFile';
import { sendMessage } from './sendMsg';

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
    filesToSend: Array<string> = [''],
    _messages: Array<string>
): Promise<void> {
    if (!device?.isConnected) {
        throw new Error('Device not connected');
    }
    if (!instructions) {
        throw new Error('Instructions are required');
    }
    if (filesToSend) {
        for (let file of filesToSend) {
            await sendFile(device, file).catch(error => {
                throw new Error('File send failed: ' + (error as Error).message);
            });
            // Wait for confirmation before sending the next file
            const filename = file.split('/').pop();
            await waitForResponse(device, `Audio Datei gespeichet als ${filename}`);
        }
    }
    await sendMessage(device, '2' + instructions);
    return Promise.resolve();
}
