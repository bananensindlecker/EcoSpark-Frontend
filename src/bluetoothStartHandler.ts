import { BluetoothDevice } from 'react-native-bluetooth-classic';
import { sendFile } from './sendFile';
import { sendMessage } from './sendMsg';

export async function startHandler(instructions:string, device: BluetoothDevice, filesToSend: Array<string> = ['']): Promise<void> {
    if (!device?.isConnected) {
        throw new Error('Device not connected');
    }
    if (!instructions) {
        throw new Error('Instructions are required');
    }
    if (filesToSend){
        for (let file of filesToSend){
            await sendFile(device, file).catch(error => {throw new Error('File send failed: ' + (error as Error).message);});
        }
    }
    await sendMessage(device, '2' + instructions);
    return Promise.resolve();
}
