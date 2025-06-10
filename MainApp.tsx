/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react-native/no-inline-styles */
import React, { useState, useRef, useEffect, Fragment } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView as RNScrollView,
  TextInput,
  Alert,
  Button,
  Pressable,
  Modal,
  BackHandler,
  Platform,
  GestureResponderEvent,
  useWindowDimensions,
  Switch,
  Image,
  Animated,
  TouchableWithoutFeedback,
  Easing,
  Dimensions,
  ScrollView,
} from 'react-native';
import {
  pick,
  types,
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
  LocalCopyResponse,
  DocumentPickerResponse,
} from '@react-native-documents/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectToPi } from './communicateWithPi';
import { useBluetoothMessages } from './readMsg';
import { BluetoothDevice } from 'react-native-bluetooth-classic';
import Sound from 'react-native-sound';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
// @ts-ignore
import { createStyles } from './styles';
// @ts-ignore
import ImmersiveMode from 'react-native-immersive';
import { Picker } from '@react-native-picker/picker';
import StatsSwitcher from './switch';
import { sendFile } from './sendFile';
import { sendMessage } from './sendMsg';
import RNFS from 'react-native-fs';
import { startHandler } from './bluetoothStartHandler';

export default function App() {
const [direction, setDirection] = useState<'L' | 'R' | 'B'>('L');

const [device, setDevice] = useState<BluetoothDevice | null>(null);

const pinMap: Record<string, { L: string; R: string }> = {
  'Licht Rot': { L: '08', R: '12' },
  'Licht Grün': { L: '07', R: '16' },
  'Licht Gelb': { L: '20', R: '20' },
  'Licht Blau': { L: '24', R: '21' },
  'Flutlicht': { L: '17', R: '27' },
  'Pinspots Rot': { L: '22', R: '11' },
  'Pinspots Grün': { L: '10', R: '05' },
  'Pinspots Blau': { L: '09', R: '06' },
  'Motor': { L: '02', R: '03'},
};

  useEffect(() => {
  console.log('ImmersiveMode:', ImmersiveMode);
}, []);

  useEffect(() => {
  ImmersiveMode.setImmersive(true); // oder einfach:
  ImmersiveMode.on();               // Startet immersiven Modus
}, []);
 const { width, height } = useWindowDimensions();
  const styles = createStyles(width, height);

  type LayeredSegment = {
  id: number;
  light: string;
  start: number;
  end: number;
  layer: number;
  rotateRight: boolean;
  file?: string;

};
type LightSegment = {
  id: number;
  light: string;
  start: number;
  end: number;
  layer: number;
};

type LayeredSound = {
  id: number;
  sound: string;
  start: number;
  end: number;
  layer: number;
  volume: number;
  description: string;
  file?: string;
};

type Layered3D = {
  id: number;
  model: string;
  start: number;
  end: number;
  layer: number;
  rotateRight: boolean;
};
type SoundSegment = {
  id: number;
  sound: string;
  description: string;
  start: number;
  end: number;
  volume: number;
  layer: number;
  file?: string;
};
type ThreeDSegment = {
  id: number;
  model: string;
  start: number;
  end: number;
  layer: number;
  rotateRight: boolean;
};

useEffect(() => {
  changeNavigationBarColor('transparent', true, true); // Farbe, Light-Icons, Fullscreen
}, []);

const id = Date.now() + Math.random(); // einfache eindeutige Zahl


  Sound.setCategory('Playback');  // einmalig konfigurieren
// StatesSoundEditor_______________________________________________________________________________________________________________________________
  type BuiltInSound = {
  name: string;
  file: string;
  description: string;
  duration: number;
};

  const [soundDuration, setSoundDuration] = useState<number>(0);
  const [selectedSoundVolume, setSelectedSoundVolume] = useState<number>(100);
  const [selectedSoundDescription, setSelectedSoundDescription] = useState<string>('');
  const deleteLightSegmentById = (boxId: number, id: number) => {
  setLightSegmentsPerBox(prev => ({
    ...prev,
    [boxId]: prev[boxId].filter(seg => seg.id !== id),
  }));
};


  // ─── Hilfsfunktion: lade eingebauten Sound und lies Dauer aus ───────────────
const loadBuiltInSound = (
  name: string,
  file: string,
  description: string
) => {
  // ⚠️ Achte darauf, dass hier `file` exakt dem Dateinamen in res/raw entspricht,
  // z.B. 'sound1.wav' (in Kleinbuchstaben und mit Endung)
  const snd = new Sound(
    file,
    Sound.MAIN_BUNDLE,
    (err) => {
      if (err) {
        Alert.alert('Fehler beim Laden', err.message);
        return;
      }

      const actualDuration = snd.getDuration();

      // Zustand aktualisieren
      setSelectedSound(name);
      setSelectedSoundDescription(description);
      setSelectedSoundFile(file);
      setSoundDuration(actualDuration);
      setSelectedSoundVolume(100);

      // 🎵 Sound EINMAL abspielen
      snd.play((success) => {
        if (!success) {
          console.warn('Sound konnte nicht abgespielt werden.');
        }
        snd.release(); // Speicher freigeben
      });

      // Dauer im builtInSounds-Array aktualisieren
      setBuiltInSounds(prev =>
        prev.map(sound =>
          sound.name === name
            ? { ...sound, duration: actualDuration }
            : sound
        )
      );
    }
  );
};

const PIXELS_PER_SECOND = 20;
const screenWidth = Dimensions.get('window').width;
const [scrollX, setScrollX] = useState(0);


  const [builtInSounds, setBuiltInSounds] = useState<BuiltInSound[]>([
  { name: 'sound 1', file: 'sound1.wav', description: 'Test1', duration: 1 },
  { name: 'sound 2', file: 'sound2.wav', description: 'Test2', duration: 1 },
  { name: 'sound 3', file: 'sound3.wav', description: 'Test3', duration: 1 },
  { name: 'sound 4', file: 'sound4.wav', description: 'Test4', duration: 1 },
  { name: 'sound 5', file: 'sound5.wav', description: 'Test5', duration: 1 },
  { name: 'sound 6', file: 'sound6.wav', description: 'Test6', duration: 1 },
  // Füge hier einfach weitere Einträge hinzu, je nachdem wie viele .wav-Dateien du hast.
  ]);
// StatesSoundEditorEnd____________________________________________________________________________________________________________________________

const MAX_DURATION = 180;

function clampTime(value: number): number {
  return Math.max(0, Math.min(value, MAX_DURATION));
}

//Bluethooth_____________________________________________________________________________________________________________________________________________

const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice>(null as unknown as BluetoothDevice);
  const [message, setMessage] = useState<string>('');
  const [fileNames, setFileNames] = useState<Array<string>>([]);
  const { messages,connected} = useBluetoothMessages(connectedDevice);
  let filePath = '/storage/emulated/0/Download/test.wav'; //

// BluetoothEnd__________________________________________________________________________________________________________________________________________
// Double-Click_________________________________________________________________________________________________________________________________________

const lastTapRef = useRef<number | null>(null);
const handleNameDoubleTap = () => {
  const now = Date.now();
  const DOUBLE_PRESS_DELAY = 1000; // ms bis zum nächsten Tap
  if (lastTapRef.current && now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
    // Doppel-Tap erkannt → in den Bearbeiten-Modus wechseln
    const currentName = boxData.find(b => b.id === selectedBoxId!)?.name || '';
    setRenameValue(currentName);
    setShowRenameModal(true);
  }
  lastTapRef.current = now;
};

// Double-ClickEnd______________________________________________________________________________________________________________________________________
// TimeforEffects_______________________________________________________________________________________________________________________________________
const [showLengthModal, setShowLengthModal] = useState(false);
const [lengthTempValue, setLengthTempValue] = useState<string>('');
const [lengthInitialValue, setLengthInitialValue] = useState<string>('');
const lastLengthTapRef = useRef<number | null>(null);
const DOUBLE_PRESS_DELAY = 1000;  // ms

const openLengthModal = (boxId: number) => {
  const current = String(timelineLengthsPerBox[boxId] ?? '');
  setLengthInitialValue(current);
  setLengthTempValue(current);
  setSelectedBoxId(boxId);
  setShowLengthModal(true);
};

// Double-Tap-Erkennung auf den Effekt-Block
const handleBlockDoubleTap = (boxId: number) => {
  const now = Date.now();
  if (lastLengthTapRef.current && now - lastLengthTapRef.current < DOUBLE_PRESS_DELAY) {
    openLengthModal(boxId);
  }
  lastLengthTapRef.current = now;
};
// TimeforEffectsEnd____________________________________________________________________________________________________________________________________

// Gap__________________________________________________________________________________________________________________________________________________

const [showGapModal, setShowGapModal] = useState(false);
const [gapTempValue, setGapTempValue] = useState<string>('');
const [gapInitialValue, setGapInitialValue] = useState<string>(''); // merkt den "Startwert"
const [selectedGapId, setSelectedGapId] = useState<number | null>(null);

const openGapModal = (gapId: number) => {
  const current = gapTimes[gapId] ?? '0';
  setGapInitialValue(current);    // Merke dir, was zuletzt gespeichert war
  setGapTempValue(current);       // Arbeit mit dieser Temp-Variable im Input
  setSelectedGapId(gapId);
  setShowGapModal(true);
};

// GapEnd_______________________________________________________________________________________________________________________________________________


type Box = {
  id: number;
  name: string;
};

  // mit dem neuen Typ und Feld "name" statt "text"
const [boxData, setBoxData] = useState<Box[]>([
  { id: 1, name: 'Effekt 1' },
]);
  const [renameValue, setRenameValue] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);

  const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [ImportMode, setimportMode] = useState(false);

  // Modal flags
  const [editLichtEffekte, setEditLichtEffekte] = useState(false);
  const [editSoundEffekte, setEditSoundEffekte] = useState(false);
  const [edit3DEffekte, setEdit3DEffekte] = useState(false);

  // Selected effect and times
  const [selectedLight, setSelectedLight] = useState<string | null>(null);
  const [startTimeLight, setStartTimeLight] = useState('');
  const [endTimeLight, setEndTimeLight] = useState('');

  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [startTimeSound, setStartTimeSound] = useState('');
  const [selectedSoundFile, setSelectedSoundFile] = useState<string | null>(null);


  const [selected3D, setSelected3D] = useState<string | null>(null);
  const [startTime3D, setStartTime3D] = useState('');
  const [endTime3D, setEndTime3D] = useState('');
  const [rotateRight, setRotateRight] = useState(true);

  const [editingSegmentId, setEditingSegmentId] = useState<number | null>(null);
  const [editingSegmentType, setEditingSegmentType] = useState<'light' | 'sound' | 'three_d' | null>(null);

  // Timeline lengths per box
  const [timelineLengthsPerBox, setTimelineLengthsPerBox] = useState<{ [boxId: number]: number }>({});
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  // Für die Hervorhebung aktiver Segmente
const [currentTime, setCurrentTime] = useState<number>(0);
// Optional: Breite des Containers, um Playhead exakt zu positionieren
const [containerWidth, setContainerWidth] = useState<number>(0);


  // Segments per effect type per box
  const [lightSegmentsPerBox, setLightSegmentsPerBox] = useState<{ [boxId: number]: LayeredSegment[] }>({});
  const [soundSegmentsPerBox, setSoundSegmentsPerBox] = useState<{ [boxId: number]: LayeredSound[] }>({});
  const [threeDSegmentsPerBox, setThreeDSegmentsPerBox] = useState<{ [boxId: number]: ThreeDSegment[] }>({});

  const [ShowLoaderScreen, setShowLoaderScreen] = useState(false);

  const [connectUi, setconnectUi] = useState(false);
  // Index der aktuell bearbeiteten Lücke (zwischen Effekt i und i+1)
  const [selectedGapIndex, setSelectedGapIndex] = useState<number | null>(null);
  // Map von Lücken-Index → Zeit-String
  const [gapTimes, setGapTimes] = useState<{ [index: number]: string }>({});


  // Overlap handling
  const [overlapModalLight, setOverlapModalLight] = useState(false);

  const [overlapModalSound, setOverlapModalSound] = useState(false);

  const [overlapModal3D, setOverlapModal3D] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollBarWidth, setScrollBarWidth] = useState(0);


  // Compute segments and max end for each type
  const lightSegs = selectedBoxId !== null ? lightSegmentsPerBox[selectedBoxId] || [] : [];
  const soundSegs = selectedBoxId !== null ? soundSegmentsPerBox[selectedBoxId] || [] : [];
  const d3Segs = selectedBoxId !== null ? threeDSegmentsPerBox[selectedBoxId] || [] : [];

  const sortedLight = [...lightSegs].sort((a, b) => a.start - b.start);
  const sortedSound = [...soundSegs].sort((a, b) => a.start - b.start);
  const sorted3D = [...d3Segs].sort((a, b) => a.start - b.start);

  const maxEnd = Math.max(
    sortedLight.length ? Math.max(...sortedLight.map(s => s.end)) : 0,
    sortedSound.length ? Math.max(...sortedSound.map(s => s.end)) : 0,
    sorted3D.length ? Math.max(...sorted3D.map(s => s.end)) : 0,
  );

  // Update timeline length
 useEffect(() => {
  if (selectedBoxId !== null) {
    setTimelineLengthsPerBox(prev => {
      const current = prev[selectedBoxId] || 1;
      const cappedEnd = Math.min(maxEnd, MAX_DURATION); // Begrenzung
      if (cappedEnd > current) {
        return { ...prev, [selectedBoxId]: cappedEnd };
      }
      return prev;
    });
  }
}, [maxEnd, selectedBoxId]);

useEffect(() => {
  (async () => {
    try {
      const json = await AsyncStorage.getItem(SOUNDS_STORAGE_KEY);
      if (json) {
        const saved: BuiltInSound[] = JSON.parse(json);
        setBuiltInSounds(saved);
      }
    } catch (e) {
      console.warn('Fehler beim Laden der Sounds:', e);
    }
  })();
}, []);
  const segmentColors = ['#FFA500', '#4CAF50', '#2196F3', '#9C27B0', '#FF5722'];

// Handlers_______________________________________________________________________________________________________________________________________________________
const handleDeleteSegment = () => {
  if (!selectedSegment) {return;}
  const { type, boxId, id } = selectedSegment;

  if (type === 'light') {
    setLightSegmentsPerBox(prev => ({
      ...prev,
      [boxId]: prev[boxId].filter(seg => seg.id !== id), // ✅ korrekt
    }));
  } else if (type === 'sound') {
    setSoundSegmentsPerBox(prev => ({
      ...prev,
      [boxId]: prev[boxId].filter(seg => seg.id !== id),
    }));
  } else if (type === 'three_d') {
    setThreeDSegmentsPerBox(prev => ({
      ...prev,
      [boxId]: prev[boxId].filter(seg => seg.id !== id),
    }));
  }

  setSelectedSegment(null);
};


const handleEditSegment = () => {
  if (!selectedSegment) {return;}
  const { type, boxId, id } = selectedSegment;

  if (type === 'light') {
    const seg = lightSegmentsPerBox[boxId].find(s => s.id === id);
    if (!seg) {return;}

    setSelectedLight(seg.light);
    setStartTimeLight(String(seg.start));
    setEndTimeLight(String(seg.end));
    setEditingSegmentId(seg.id); // Wichtig!
    setEditingSegmentType('light');
    setSelectedSegment(null);
  } else if (type === 'sound') {
  const segs = soundSegmentsPerBox[boxId] || [];
  const seg = segs.find(s => s.id === id);
  if (!seg) {return;}

  setSelectedSound(seg.sound);
  setStartTimeSound(String(seg.start));
  setSelectedSoundDescription(seg.description);
  setSelectedSoundVolume(seg.volume);
  setSoundDuration(seg.end - seg.start);

  setEditingSegmentId(seg.id);
  setEditingSegmentType('sound');
  setSelectedSegment(null);
} else if (type === 'three_d') {
  const segs = threeDSegmentsPerBox[boxId] || [];
  const seg = segs.find(s => s.id === id);
  if (!seg) {return;}

  setSelected3D(seg.model);
  setStartTime3D(String(seg.start));
  setEndTime3D(String(seg.end));

  setEditingSegmentId(seg.id);
  setEditingSegmentType('three_d');
  setSelectedSegment(null);
}


  setSelectedSegment(null);
};


const handleExit = () => {
    if (Platform.OS === 'android') {
      BackHandler.exitApp();
    } else {
      // iOS erlaubt kein programmatisches Beenden
      console.warn('Programmatisches Beenden ist auf iOS nicht möglich.');
    }
  };

 const handleSuchen = async () => {
  try {
    const json = await AsyncStorage.getItem(SAVE_KEY);
    const parsed: SequenceSave[] = json ? JSON.parse(json) : [];
    if (parsed.length === 0) {
      Alert.alert('Keine gespeicherten Sequenzen');
      return;
    }
    setSavedSequences(parsed);
    setShowLoadModal(true);
  } catch (e) {
    Alert.alert('Fehler beim Laden');
  }
};

  const handleSave = () => {
  setSaveName('');
  setShowSaveModal(true);
};
const confirmSave = async () => {
  if (!saveName.trim()) {
    Alert.alert('Name fehlt', 'Bitte gib einen Namen ein.');
    return;
  }

  const newEntry: SequenceSave = {
    name: saveName.trim(),
    data: {
      boxData,
      timelineLengthsPerBox,
      lightSegmentsPerBox,
      soundSegmentsPerBox,
      threeDSegmentsPerBox,
      gapTimes,
      customLightEffects,
    },
  };

  try {
    const existing = await AsyncStorage.getItem(SAVE_KEY);
    const parsed = existing ? JSON.parse(existing) : [];
    parsed.push(newEntry);
    await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(parsed));
    Alert.alert('Gespeichert', `"${saveName}" wurde gespeichert.`);
    setShowSaveModal(false);
  } catch (e) {
    Alert.alert('Fehler beim Speichern');
  }
};

const getLightNumber = (name: string, rotateRight: boolean): string => {
  const entry = pinMap[name];
  if (!entry) {return name;} // fallback
  return rotateRight ? entry.R : entry.L;
};


const handleStart = async () => {
  type SeqItem = {
    type: 'light' | 'sound' | 'three_d' | 'gap';
    name: string;
    start: number;
    end?: number;
    pin?: number;
    blinking?: {
      freq: string;
      on?: string;
    };
    rotateRight?: boolean;
    volume?: number;
    selectedSoundFile?: string;
  };

  const sequence: SeqItem[] = [];
  let globalOffset = 0;

  // Array für alle Sound-Dateipfade
  const arrayOfFilePathsToSend: string[] = [];
  // Fester Pfad zum Raw-Ordner (kann bei Bedarf als Variable rausgezogen werden)
  const basePath = 'C:\\Users\\Jeremy\\ProjectEcoSpark\\android\\app\\src\\main\\res\\raw\\';

  boxData.forEach((box, idx) => {
    const lightSegs = (lightSegmentsPerBox[box.id] || []).sort((a, b) => a.start - b.start);
    lightSegs.forEach(seg => {
      const lightEffect = customLightEffects.find(e => e.name === seg.light);
      const pin = lightEffect?.pin;

      sequence.push({
        type: 'light',
        name: pin !== undefined ? pin.toString().padStart(2, '0') : seg.light,
        start: globalOffset + seg.start,
        end: globalOffset + seg.end,
        blinking: lightEffect?.blinking ? { freq: lightEffect.blinking.freq } : undefined,
        rotateRight: seg.rotateRight,
        pin,
      });
    });

    const soundSegs = (soundSegmentsPerBox[box.id] || []).sort((a, b) => a.start - b.start);
    soundSegs.forEach(seg => {
      sequence.push({
        type: 'sound',
        name: seg.sound,
        start: globalOffset + seg.start,
        volume: seg.volume,
        selectedSoundFile: seg.file,
      });

      // NEU: Dateipfad hinzufügen, falls seg.file definiert ist
      if (seg.file) {
        // Nur den Dateinamen extrahieren, falls seg.file ein Pfad ist (z.B. "sounds/sound1.wav")
        const fileName = seg.file.split(/[\\/]/).pop();
        if (fileName) {
          const fullPath = basePath + fileName;
          if (!arrayOfFilePathsToSend.includes(fullPath)) {
            arrayOfFilePathsToSend.push(fullPath);
          }
        }
      }
    });

    const d3Segs = (threeDSegmentsPerBox[box.id] || []).sort((a, b) => a.start - b.start);
    d3Segs.forEach(seg => {
      sequence.push({
        type: 'three_d',
        name: seg.model,
        start: globalOffset + seg.start,
        end: globalOffset + seg.end,
        rotateRight: seg.model === 'Spinn' ? seg.rotateRight : undefined,
      });
    });

    const boxEnd = timelineLengthsPerBox[box.id] ??
      Math.max(
        lightSegs.length ? Math.max(...lightSegs.map(s => s.end)) : 0,
        soundSegs.length ? Math.max(...soundSegs.map(s => s.end ?? 0)) : 0,
        d3Segs.length ? Math.max(...d3Segs.map(s => s.end)) : 0,
        0
      );

    globalOffset += boxEnd;

    if (idx < boxData.length - 1) {
      const gapSec = parseFloat(gapTimes[idx] || '') || 1;
      sequence.push({
        type: 'gap',
        name: `${idx}`,
        start: globalOffset,
        end: globalOffset + gapSec,
      });
      globalOffset += gapSec;
    }
  });

  const lines = sequence.map((item, i) => {
    const startStr = item.start.toString().padStart(4, '0') + '000';
    const endStr = item.end !== undefined ? item.end.toString().padStart(4, '0') + '000' : '';
    let displayName = item.name;

    if (item.type === 'three_d' && item.name === 'Spinn' && item.rotateRight !== undefined) {
      const motorPins = pinMap.Motor;
      displayName = item.rotateRight ? motorPins.R : motorPins.L;
    }

    if (item.type === 'sound' && item.selectedSoundFile) {
      displayName = item.selectedSoundFile.split('/').pop() || item.name;
    }

    let line = `${item.type},${displayName},${startStr}`;
    if (endStr) {line += `,${endStr}`;}
    if (item.type === 'light' && item.blinking?.freq) {line += `,${item.blinking.freq}`;}
    if (item.type === 'sound' && item.volume !== undefined) {line += `,${item.volume}`;}

    return i < sequence.length - 1 ? `${line}?` : line;
  });

  const output = lines.join('\n');
  console.log(output);
  Alert.alert('Sequenz', output);

  // Übergabe des neuen arrays an startHandler
  startHandler(output, connectedDevice, arrayOfFilePathsToSend);
};


  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollWidth = layoutMeasurement.width;
    const contentWidth = contentSize.width;
    const position = contentOffset.x;
    const barWidth = contentWidth > 0 ? (scrollWidth / contentWidth) * scrollWidth : 0;
    const scrollBarPosition = (position / (contentWidth - scrollWidth)) * (scrollWidth - barWidth);
    setScrollBarWidth(barWidth);
    setScrollPosition(scrollBarPosition);
  };
  const handleImportSound = async () => {
  try {
    const results: DocumentPickerResponse[] = await pick({
  type: ['audio/wav'], // nur WAV-Dateien zulassen
});
    if (!results || results.length === 0) {return;}

    const file = results[0];
    if (!file.name || !file.uri) {return;}

    if (!file.name.toLowerCase().endsWith('.wav')) {
    Alert.alert('Ungültige Datei', 'Bitte wähle nur eine .wav-Datei aus.');
    return;
}
    const copies: LocalCopyResponse[] = await keepLocalCopy({
      files: [{ uri: file.uri, fileName: file.name }],
      destination: 'cachesDirectory',
    });

    if (!copies || copies.length === 0) {
      Alert.alert('Fehler', 'Konnte keine Kopie der Datei erstellen.');
      return;
    }

    const copy = copies[0];
    if (copy.status !== 'success') {
      Alert.alert('Fehler', `Kopieren fehlgeschlagen: ${copy.copyError}`);
      return;
    }

    const localPath = copy.localUri;
    const cleanName = file.name.replace(/\.(wav|mp3)$/i, '');

    const importedSound = new Sound(localPath, '', async (err) => {
      if (err) {
        Alert.alert('Fehler beim Laden des Sounds', err.message);
        return;
      }

      const duration = importedSound.getDuration();
      const newEntry: BuiltInSound = {
        name: cleanName,
        file: localPath,
        description: 'Importiert',
        duration,
      };

      // State & Speicher aktualisieren
      setBuiltInSounds(prev => {
        const updated = [...prev, newEntry];
        AsyncStorage.setItem(SOUNDS_STORAGE_KEY, JSON.stringify(updated))
          .catch(e => console.warn('Fehler beim Speichern:', e));
        return updated;
      });
    });
  } catch (err) {
    if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {return;}
    Alert.alert('Importfehler', JSON.stringify(err));
  }
};



// HandlersEnd_____________________________________________________________________________________________________________________________________________________
// Minimum-Decimal-Places__________________________________________________________________________________________________________________________________________
  // Hilfsfunktion in deiner Komponente definieren:
  const formatOneDecimal = (text: string): string => {
    // Erlaube nur Ziffern und Punkt
    let cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 1) {
      // Ganzzahl + ein Dezimalzeichen
      cleaned = parts[0] + '.' + parts[1].slice(0, 2);
    }
    return cleaned;
  };
// Minimum-Decimal-PlacesEnd_______________________________________________________________________________________________________________________________________
// Segment-Layer-finder____________________________________________________________________________________________________________________________________________
  const findAvailableLayer = (segments: { start: number; end: number; layer: number }[], start: number, end: number): number | null => {
  const MAX_LAYERS = 4;
  for (let layer = 0; layer < MAX_LAYERS; layer++) {
    const hasOverlap = segments.some(s =>
      s.layer === layer && !(end <= s.start || start >= s.end)
    );
    if (!hasOverlap) {return layer;}
  }
  return null;
};
// Segment-Layer-finderEnd________________________________________________________________________________________________________________________________________
// Add-Segments-to-timeline_______________________________________________________________________________________________________________________________________







const handleConfirmLight = () => {
  if (selectedBoxId === null || !selectedLight) {return;}

  const rawStart = Number(startTimeLight);
  const rawEnd = Number(endTimeLight);
  if (isNaN(rawStart) || isNaN(rawEnd) || rawStart >= rawEnd) {
    Alert.alert('Ungültig', 'Bitte gültige Start- und Endzeit eingeben.');
    return;
  }

  const start = clampTime(rawStart);
  const end = clampTime(rawEnd);

  addLightSegment({ light: selectedLight, start, end });

  setSelectedLight(null);
  setStartTimeLight('');
  setEndTimeLight('');
};









const handleConfirmSound = () => {
  if (selectedBoxId === null || !selectedSound) { return; }
  console.log('Aktuelle Lautstärke für 3D:', selectedSoundVolume);
  const start = Number(startTimeSound);
  const end   = start + soundDuration;
  if (isNaN(start) || start < 0 || start >= end || selectedSoundVolume < 0 || selectedSoundVolume > 100) {
    Alert.alert('Ungültige Eingabe', 'Bitte überprüfe Startzeit und Lautstärke (0–100%).');
    return;
  }

  // ── Alten Effekt löschen, falls im Edit-Modus
  if (editingSegmentType === 'sound' && editingSegmentId !== null) {
    handleDeleteSegment();
  }

  // ── Neues Segment anlegen
  addSoundSegment({
    sound: selectedSound,
    start,
    end,
    volume: selectedSoundVolume,
    description: selectedSoundDescription,
    file: selectedSoundFile || '',
  });

  // ── Reset
  setStartTimeSound('');
  setSelectedSound(null);
  setSelectedSoundVolume(100);
  setSelectedSoundDescription('');
  // edit state wird in addSoundSegment zurückgesetzt
};
const handleConfirm3D = () => {
  if (selectedBoxId !== null && selected3D) {
    const start = Number(startTime3D);
    const end = Number(endTime3D);

    // ─── Validierung ───
    if (isNaN(start) || isNaN(end) || start >= end) {
      Alert.alert('Ungültige Zeitangabe', 'Bitte gib eine gültige Start- und Endzeit an.');
      return;
    }

    // ─── Altes Segment ggf. löschen ───
    if (editingSegmentType === 'three_d' && editingSegmentId !== null) {
      handleDeleteSegment(); // entfernt das alte Segment
    }

    // ─── Neues Segment hinzufügen ───
    add3DSegment({
      model: selected3D,
      start,
      end,
      rotateRight: selected3D === 'Spinn' ? (rotateRight ?? false) : false,
    });

    // ─── Reset Inputs ───
    setStartTime3D('');
    setEndTime3D('');
    setSelected3D(null);
  }
};



const addLightSegment = (seg: { light: string; start: number; end: number }) => {
  if (selectedBoxId === null) {
    return;
  }

  let segments = lightSegmentsPerBox[selectedBoxId] || [];

  // Debug-Ausgabe
  console.log('Bearbeite:', editingSegmentId);
  console.log('Vorher:', segments.map(s => s.id));

  if (editingSegmentType === 'light' && editingSegmentId !== null) {
    segments = segments.filter(s => s.id !== editingSegmentId);
  }

  const layer = findAvailableLayer(segments, seg.start, seg.end);
  if (layer === null) {
    Alert.alert('Kein Platz', 'Alle 4 Layer für Licht sind belegt.');
    return;
  }

  const newSeg: LayeredSegment = {
    id: Date.now() + Math.random(),
    ...seg,
    layer,
    rotateRight: false, // Hier das Feld ergänzen
  };

  setLightSegmentsPerBox(prev => ({
    ...prev,
    [selectedBoxId]: [...segments, newSeg],
  }));

  setEditingSegmentId(null);
  setEditingSegmentType(null);
};







  const addSoundSegment = (seg: {
  sound: string;
  description: string;
  start: number;
  end: number;
  volume: number;
  file: string;
}) => {
  if (selectedBoxId === null) {return;}

  let segments = soundSegmentsPerBox[selectedBoxId] || [];
  console.log('Bearbeite:', editingSegmentId);
  console.log('Vorher:', segments.map(s => s.id));

  if (editingSegmentType === 'sound' && editingSegmentId !== null) {
    segments = segments.filter(s => s.id !== editingSegmentId); // <== hier ändern!
  }

  const layer = findAvailableLayer(segments, seg.start, seg.end);
  if (layer === null) {
    Alert.alert('Kein Platz', 'Alle 4 Layer für Sound sind belegt.');
    return;
  }

  const newSeg: SoundSegment = {
    id: Date.now() + Math.random(),
    ...seg,
    layer,
  };

  setSoundSegmentsPerBox(prev => ({
    ...prev,
    [selectedBoxId]: [...segments, newSeg],
  }));

  setEditingSegmentId(null);
  setEditingSegmentType(null);
};


const add3DSegment = (seg: {
  model: string;
  start: number;
  end: number;
  rotateRight?: boolean;
}) => {
  if (selectedBoxId === null) { return; }

  let segments = threeDSegmentsPerBox[selectedBoxId] || [];
  console.log('Bearbeite:', editingSegmentId);
  console.log('Vorher:', segments.map(s => s.id));

  if (editingSegmentType === 'three_d' && editingSegmentId !== null) {
    segments = segments.filter(s => s.id !== editingSegmentId); // <== hier ändern!
  }

  const layer = findAvailableLayer(segments, seg.start, seg.end);
  if (layer === null) {
    Alert.alert('Kein Platz', 'Alle 4 Layer für 3D sind belegt.');
    return;
  }

  const newSeg: ThreeDSegment = {
    id: Date.now() + Math.random(),
    ...seg,
    layer,
    rotateRight: seg.rotateRight ?? false, // hinzugefügt
  };

  setThreeDSegmentsPerBox(prev => ({
    ...prev,
    [selectedBoxId]: [...segments, newSeg],
  }));

  setEditingSegmentId(null);
  setEditingSegmentType(null);
};


// Add-Segments-to-timelineEnd____________________________________________________________________________________________________________________________________
// SaveFunction___________________________________________________________________________________________________________________________________________________
const [showSaveModal, setShowSaveModal] = useState(false);
const [saveName, setSaveName] = useState('');

const SAVE_KEY = 'saved_sequences';

type SequenceSave = {
  name: string;
  data: {
    boxData: Box[];
    timelineLengthsPerBox: { [boxId: number]: number };
    lightSegmentsPerBox: { [boxId: number]: LayeredSegment[] };
    soundSegmentsPerBox: { [boxId: number]: LayeredSound[] };
    threeDSegmentsPerBox: { [boxId: number]: Layered3D[] };
    gapTimes: { [index: number]: string };
     customLightEffects: {
     name: string;
     desc: string;
     color: string;
     blinking?: { freq: string; on: string };
   }[];
  };
};
const SOUNDS_STORAGE_KEY = 'built_in_sounds';

// SaveFunktionEnd________________________________________________________________________________________________________________________________________________
// TimelineEasyEdit_______________________________________________________________________________________________________________________________________________
const [selectedSegment, setSelectedSegment] = useState<{
  type: 'light' | 'sound' | 'three_d';
  boxId: number;
  id: number; // 🔄 statt segIndex
} | null>(null);


// TimelineEasyEditEnd____________________________________________________________________________________________________________________________________________
// SearchFunktion_________________________________________________________________________________________________________________________________________________
const [savedSequences, setSavedSequences] = useState<SequenceSave[]>([]);
const [showLoadModal, setShowLoadModal] = useState(false);
const loadSequence = (seq: SequenceSave) => {
  const { boxData, timelineLengthsPerBox, lightSegmentsPerBox, soundSegmentsPerBox, threeDSegmentsPerBox, gapTimes, customLightEffects } = seq.data;
  setBoxData(boxData);
  setTimelineLengthsPerBox(timelineLengthsPerBox);
  setLightSegmentsPerBox(lightSegmentsPerBox);
  setSoundSegmentsPerBox(soundSegmentsPerBox);
  setThreeDSegmentsPerBox(threeDSegmentsPerBox);
  setGapTimes(gapTimes);
  setCustomLightEffects(customLightEffects);
  setSelectedBoxId(null);
  setShowLoadModal(false);
  Alert.alert('Geladen', `"${seq.name}" wurde geladen.`);
};
// DeleteFunktionforSave__________________________________________________________________________________________________________________________________________
const confirmDeleteSave = (nameToDelete: string) => {
  Alert.alert(
    'Löschen bestätigen',
    `Soll "${nameToDelete}" wirklich gelöscht werden?`,
    [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: async () => {
          try {
            const existing = await AsyncStorage.getItem(SAVE_KEY);
            const parsed: SequenceSave[] = existing ? JSON.parse(existing) : [];
            const filtered = parsed.filter(p => p.name !== nameToDelete);
            await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(filtered));
            setSavedSequences(filtered);
            Alert.alert('Gelöscht', `"${nameToDelete}" wurde entfernt.`);
          } catch (e) {
            Alert.alert('Fehler beim Löschen');
          }
        },
      },
    ]
  );
};

  function setConnectBluetooth(event: GestureResponderEvent): void {
    throw new Error('Function not implemented.');
  }

// DeleteFunktionforSaveEnd_______________________________________________________________________________________________________________________________________
// SearchFunktionEnd______________________________________________________________________________________________________________________________________________
// NewLigthEffekt_________________________________________________________________________________________________________________________________________________
const [showNewLightModal, setShowNewLightModal] = useState(false);
const [newLightName, setNewLightName] = useState('');
const [newLightDesc, setNewLightDesc] = useState('');
const [newLightColor, setNewLightColor] = useState('Weiß');
const currentLightNumber = getLightNumber(newLightColor, rotateRight);
const [isBlinking, setIsBlinking] = useState(false);
const [blinkFrequency, setBlinkFrequency] = useState('');
const [blinkOnDuration, setBlinkOnDuration] = useState('');

// Am Anfang deines App-Komponents
const [customLightEffects, setCustomLightEffects] = useState<{
  name: string;
  desc: string;
  color: string;
  blinking?: { freq: string; on: string };
  pin?: number;
}[]>([]);
// Delete
// oberhalb deiner return()
const lastCustomTapRef = useRef<{ [key: string]: number }>({});
  function save3DEffekt(arg0: { type: string; start: number; end: number; }) {
    throw new Error('Function not implemented.');
  }

// DeleteEnd
// NewLigthEffektEnd______________________________________________________________________________________________________________________________________________
const [selectedTab, setSelectedTab] = useState<'Build' | 'Start'>('Build');


// Animation_____________________________________________________________________________________________________________________________________________________
const bounceAnim = useRef(new Animated.Value(0)).current;

const handleBounce = () => {
  Animated.sequence([
    Animated.timing(bounceAnim, {
      toValue: -10,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.spring(bounceAnim, {
      toValue: 0,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }),
  ]).start();
};
const imageTranslateY = useRef(new Animated.Value(-height * 0.5)).current;
useEffect(() => {
  Animated.timing(imageTranslateY, {
    toValue: selectedTab === 'Start' ? 0 : -height * 0.5,
    duration: 500,
    useNativeDriver: true,
  }).start();
}, [height, imageTranslateY, selectedTab]);
const textTranslateY = useRef(new Animated.Value(-50)).current; // Startposition über dem Bildschirm
const textOpacity = useRef(new Animated.Value(0)).current;
useEffect(() => {
  if (selectedTab === 'Start') {
    Animated.parallel([
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  } else {
    Animated.parallel([
      Animated.timing(textTranslateY, {
        toValue: -50,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }
}, [selectedTab, textOpacity, textTranslateY]);
  const [activated, setActivated] = useState(false);

  // Animationen
  const animation = useRef(new Animated.Value(0)).current;
  const pingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!activated) {
      // Ping Animation nur laufen lassen, wenn nicht aktiviert
      Animated.loop(
        Animated.sequence([
          Animated.timing(pingAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(pingAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Wenn aktiviert, stoppe Ping Animation
      pingAnim.stopAnimation();
      pingAnim.setValue(0);
    }
  }, [activated, pingAnim]);

  // Animation starten, wenn aktiviert true wird
  useEffect(() => {
    Animated.timing(animation, {
      toValue: activated ? 1 : 0,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [activated, animation]);

  // Farbinterpolation: von Weiß zu Grün
  const textColor = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgb(0, 0, 0)', 'rgb(21, 92, 47)'],
  });

  // Transformationen für Button
  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4],
  });
  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4],
  });
  const shadowOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0.8],
  });
  const borderOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const pingScale = pingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });
  const pingOpacity = pingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 0],
  });

  const onPress = () => {
    if (!activated) {setActivated(true);} // Nur einmal aktivieren, kein zurück
  };
// AnimationEnd__________________________________________________________________________________________________________________________________________________
const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
const [remainingTime, setRemainingTime] = useState(0);
const handleCountdown = () => {
  const boxId = boxData[0]?.id;
  const lengthInSeconds = timelineLengthsPerBox[boxId] ?? 0;

  if (lengthInSeconds <= 0) {return;} // Sicherheitscheck

  setRemainingTime(lengthInSeconds);
  setShowLoaderScreen(true);

  // Countdown aktualisieren
  intervalRef.current = setInterval(() => {
    setRemainingTime((prev) => {
      if (prev <= 1) {
        clearInterval(intervalRef.current!);
      }
      return prev - 1;
    });
  }, 1000);

  // Nach Ablauf schließen
  timeoutRef.current = setTimeout(() => {
    setShowLoaderScreen(false);
    clearInterval(intervalRef.current!);
  }, lengthInSeconds * 1000);
};

const handleCancelCountdown = () => {
  setShowLoaderScreen(false);
  clearTimeout(timeoutRef.current!);
  clearInterval(intervalRef.current!);
};
useEffect(() => {
  if (selectedTab === 'Start') {
    setEditMode(false);
    setEditLichtEffekte(false);
    setEditSoundEffekte(false);
    setEdit3DEffekte(false);
  }
}, [selectedTab]);


return (
  <SafeAreaView style={styles.container}>
    <Animated.Image
      source={require('./assets/Hintergrund.png')}
      style={[
        styles.topImage,
        { transform: [{ translateY: imageTranslateY }] },
      ]}
      resizeMode="cover"
    />

    <StatsSwitcher selectedTab={selectedTab} onTabChange={setSelectedTab} />

    {selectedTab === 'Build' ? (
      // ─── Build-Tab: Fragment richtig öffnen und schließen ─────────────────────────
      <>
        <TouchableWithoutFeedback onPress={handleBounce}>
          <Animated.View
            style={[
              styles.EffektContainer,
              { transform: [{ translateY: bounceAnim }] },
            ]}
          >
            <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
              {boxData.length > 0 && (
                <Pressable
                  style={[
                    styles.box,
                    selectedBoxId === boxData[0].id && styles.selectedBox,
                  ]}
                  onPress={() => {
                    handleBounce(); // Animation auslösen
                    setSelectedBoxId(boxData[0].id);
                    const currentName = boxData[0].name || '';
                    setRenameValue(currentName);
                    setEditMode(true);
                    setEditLichtEffekte(false);
                    setEditSoundEffekte(false);
                    setEdit3DEffekte(false);
                  }}
                  onPressIn={() => handleBlockDoubleTap(boxData[0].id)}
                >
                  <Image
                    source={require('./assets/EffektBackground.png')}
                    style={{
                      position: 'absolute',
                      width: 340,
                      height: 200,
                      borderRadius: 10,
                    }}
                    resizeMode="cover"
                  />
                  <Text
                    style={{
                      marginTop: 160,
                      fontSize: 12,
                      color: '#FFFFFF',
                    }}
                  >
                    Länge: {timelineLengthsPerBox[boxData[0].id] ?? 0}s
                  </Text>
                </Pressable>
              )}
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
              <View>
                <TouchableOpacity onPress={handleStart}>
                  <Text>Hello</Text>
                </TouchableOpacity>
              </View>
        <View style={styles.Buttons}>
          <TouchableOpacity onPress={handleSuchen} style={{ /* optional */ }}>
            <Image
              source={require('./assets/Downlode.png')}
              style={{ width: 35, height: 35 }}
            />
            <Text>Load</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSave} style={{ /* optional */ }}>
            <Image
              source={require('./assets/Uplode.png')}
              style={{ width: 35, height: 35 }}
            />
            <Text>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setconnectUi(true)}
            style={{ /* optional */ }}
          >
            <Image
              source={require('./assets/Bluetooth.png')}
              style={{ width: 35, height: 35 }}
            />
            <Text>Connect</Text>
          </TouchableOpacity>
        </View>
      </>
    ) : (
      // ─── Upload-Tab: Ebenfalls Fragment korrekt öffnen und wieder schließen ─────────
      <>
        <View style={styles.container}>
          <Animated.Text
            style={[
              styles.HintergrundText,
              {
                transform: [{ translateY: textTranslateY }],
                opacity: textOpacity,
              },
            ]}
          >
            Let's
          </Animated.Text>

          <Animated.Text
            style={[
              styles.HintergrundText,
              {
                transform: [{ translateY: textTranslateY }],
                opacity: textOpacity,
              },
            ]}
          >
            Upload
          </Animated.Text>
        </View>

        <View style={{ alignSelf: 'center', position: 'absolute', top: '40%'}}>
          <Pressable
            onPress={onPress}
            style={{
              position: 'relative',
              alignSelf: 'flex-start',
              marginBottom: 370,
              zIndex: 1,
            }}
          >
            <Animated.View
              pointerEvents="none"
              style={[styles.dashedBorder, { opacity: borderOpacity }]}
            />

            <Animated.View
              style={[
                styles.button,
                {
                  transform: [{ translateX }, { translateY }],
                  shadowOpacity,
                },
              ]}
            >
              <Animated.Text style={[styles.text, { color: textColor }]}>
                Uplode your Effekt's
              </Animated.Text>
            </Animated.View>

            {!activated && (
              <>
                <Animated.View
                  style={[
                    styles.pingCircle,
                    styles.topRightPing,
                    {
                      transform: [{ scale: pingScale }],
                      opacity: pingOpacity,
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.pingCircle,
                    styles.bottomLeftPing,
                    {
                      transform: [{ scale: pingScale }],
                      opacity: pingOpacity,
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.smallPingCircle,
                    styles.leftCenterPing,
                    {
                      transform: [{ scale: pingScale }],
                      opacity: pingOpacity,
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.smallPingCircle,
                    styles.rightCenterPing,
                    {
                      transform: [{ scale: pingScale }],
                      opacity: pingOpacity,
                    },
                  ]}
                />
              </>
            )}
          </Pressable>

          <View style={styles.InformationContainerOuter}>
            <View style={styles.InformationContainerInner} />
            <View style={styles.InformationContainerInnerSplitt} />
          </View>
          <View style={styles.buttonStartOuter}>
            <TouchableOpacity
              style={styles.buttonStartInner}
              onPress={handleCountdown}
            >
              <Text style={{ color: '#fff', alignSelf: 'center', top: '45%' }}>Start</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Modal
          visible={ShowLoaderScreen}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCancelCountdown}
        >
          <View style={[styles.modalOverlay2, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 28, color: '#fff', marginBottom: 20 }}>
              Noch {remainingTime} Sekunden
            </Text>

            <TouchableOpacity
              onPress={handleCancelCountdown}
              style={{
                padding: 12,
                backgroundColor: '#ff4d4d',
                borderRadius: 10,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Abbrechen</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </>
     )}

            {/* Gap-Zeit-Modal */}
            {showGapModal && selectedGapIndex !== null && (
              <Modal
                visible={showGapModal}
                transparent
                animationType="slide"
                onRequestClose={() => {
                  // System-Back wie "Zurück"
                  setGapTempValue(gapInitialValue);
                  setShowGapModal(false);
                } }
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContainer}>
                    <Text style={styles.selectedText}>
                      Zeit für Pause {selectedGapIndex + 1} wählen
                    </Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={gapTempValue}
                      onChangeText={text => setGapTempValue(formatOneDecimal(text))} />

                    <View style={styles.modalButtonRow}>
                      {/* Bestätigen */}
                      <TouchableOpacity
                        style={[styles.buttonYes, styles.modalButton]}
                        onPress={() => {
                          const val = parseFloat(gapTempValue);
                          const final = isNaN(val) ? 1 : val;
                          setGapTimes(prev => ({
                            ...prev,
                            [selectedGapIndex]: final.toString(),
                          }));
                          setShowGapModal(false);
                        } }
                      >
                        <Text style={styles.buttonText}>Bestätigen</Text>
                      </TouchableOpacity>

                      {/* Zurück */}
                      <TouchableOpacity
                        style={[styles.buttonNo, styles.modalButton]}
                        onPress={() => {
                          // Temp-Wert verwerfen
                          setGapTempValue(gapInitialValue);
                          setShowGapModal(false);
                        } }
                      >
                        <Text style={styles.buttonText}>Zurück</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            )}
            {showLengthModal && selectedBoxId !== null && (
              <Modal
                visible={showLengthModal}
                transparent
                animationType="slide"
                onRequestClose={() => {
                  // System-Back wie "Zurück"
                  setLengthTempValue(lengthInitialValue);
                  setShowLengthModal(false);
                } }
              >
                <View style={styles.modalBackdrop}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Timeline-Länge einstellen</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={lengthTempValue}
                      onChangeText={text => setLengthTempValue(text.replace(/[^0-9.]/g, ''))}
                      placeholder="Sekunden"
                      placeholderTextColor="#0a0a0a" />
                    <View style={styles.modalButtonRow}>
                      {/* Bestätigen */}
                      <TouchableOpacity
                        style={[styles.buttonYes, styles.modalButton]}
                       onPress={() => {
                        let num = parseFloat(lengthTempValue);
                        if (isNaN(num)) { num = parseFloat(lengthInitialValue) || 0; }
                        if (num > 180) { num = 180; }
                        if (num < 0) { num = 0; }

                        const boxId = selectedBoxId!;
                        const newLength = num;

                        // Kürze Light-Segmente
                        setLightSegmentsPerBox(prev => {
                          const current = prev[boxId] || [];
                          const updated = current.map(seg =>
                            seg.end > newLength
                              ? { ...seg, end: Math.min(seg.end, newLength) }
                              : seg
                          ).filter(seg => seg.start < newLength); // lösche Segmente, die komplett außerhalb sind
                          return { ...prev, [boxId]: updated };
                        });

                        // Kürze Sound-Segmente
                        setSoundSegmentsPerBox(prev => {
                          const current = prev[boxId] || [];
                          const updated = current.map(seg =>
                            seg.start >= newLength ? null : {
                              ...seg,
                              end: Math.min(seg.end, newLength),
                            }
                          ).filter(Boolean) as typeof current;
                          return { ...prev, [boxId]: updated };
                        });

                        // Kürze 3D-Segmente
                        setThreeDSegmentsPerBox(prev => {
                          const current = prev[boxId] || [];
                          const updated = current.map(seg =>
                            seg.end > newLength
                              ? { ...seg, end: Math.min(seg.end, newLength) }
                              : seg
                          ).filter(seg => seg.start < newLength);
                          return { ...prev, [boxId]: updated };
                        });

                        // Timeline-Länge speichern
                        setTimelineLengthsPerBox(prev => ({
                          ...prev,
                          [boxId]: newLength,
                        }));

                        setShowLengthModal(false);
                      }}
                      >
                        <Text style={styles.buttonText}>Bestätigen</Text>
                      </TouchableOpacity>
                      {/* Zurück */}
                      <TouchableOpacity
                        style={[styles.buttonNo, styles.modalButton]}
                        onPress={() => {
                          setLengthTempValue(lengthInitialValue);
                          setShowLengthModal(false);
                        } }
                      >
                        <Text style={styles.buttonText}>Zurück</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            )}

            {showSaveModal && (
              <Modal
                visible={showSaveModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowSaveModal(false)}
              >
                <View style={styles.modalBackdrop}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Sequenz speichern</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Name eingeben"
                      value={saveName}
                      onChangeText={setSaveName} />
                    <View style={styles.modalButtons}>
                      <TouchableOpacity style={[styles.button3, styles.modalButton]} onPress={() => setShowSaveModal(false)}>
                        <Text style={styles.buttonText}>Abbrechen</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.button3, styles.modalButton]} onPress={confirmSave}>
                        <Text style={styles.buttonText}>Speichern</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            )}

            {showLoadModal && (
              <Modal
                visible={showLoadModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowLoadModal(false)}
              >
                <View style={styles.modalBackdrop}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Gespeicherte Sequenz laden</Text>
                    <ScrollView style={{ maxHeight: 200 }}>
                      {savedSequences.map((seq, index) => (
                        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
                          <TouchableOpacity
                            style={[styles.button3, { flex: 1, marginRight: 5 }]}
                            onPress={() => loadSequence(seq)}
                          >
                            <Text style={styles.buttonText}>{seq.name}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.button3, { backgroundColor: '#F44336' }]}
                            onPress={() => confirmDeleteSave(seq.name)}
                          >
                            <Text style={styles.buttonText}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      ))}

                    </ScrollView>
                    <TouchableOpacity
                      style={[styles.button3, { marginTop: 10 }]}
                      onPress={() => setShowLoadModal(false)}
                    >
                      <Text style={styles.buttonText}>Abbrechen</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            )}


            <Modal
              visible={showRenameModal}
              transparent
              animationType="slide"
              onRequestClose={() => setShowRenameModal(false)}
            >
              <View style={styles.modalBackdrop}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Effekt umbenennen</Text>
                  <TextInput
                    style={styles.input}
                    value={renameValue}
                    onChangeText={setRenameValue}
                    placeholder="Neuer Name"
                    placeholderTextColor="#0a0a0a" />
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.button3, styles.modalButton]}
                      onPress={() => {
                        // Speichern
                        setBoxData(prev => prev.map(b => b.id === selectedBoxId ? { ...b, name: renameValue } : b
                        )
                        );
                        setShowRenameModal(false);
                      } }
                    >
                      <Text style={styles.buttonText}>Speichern</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button3, styles.modalButton]}
                      onPress={() => setShowRenameModal(false)}
                    >
                      <Text style={styles.buttonText}>Abbrechen</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>



           {/* Bearbeitungs-Menü */}
           {editMode && selectedBoxId !== null && (
            <View style={styles.editMenu}>
              {/* Obere Icon-Leiste */}
              <View style={styles.editMenuTop}>
                <TouchableOpacity onPress={() => { setEditLichtEffekte(true); setEditSoundEffekte(false); setEdit3DEffekte(false); }}>
                  <Image source={require('./assets/Light.png')} style={{ width: 35, height: 35 }} />
                  <Text style={styles.iconLabel}>Light</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setEdit3DEffekte(true); setEditLichtEffekte(false); setEditSoundEffekte(false); }}>
                  <Image source={require('./assets/3D.png')} style={{ width: 35, height: 35 }} />
                  <Text style={styles.iconLabel}>3D</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setEditSoundEffekte(true); setEditLichtEffekte(false); setEdit3DEffekte(false); }}>
                  <Image source={require('./assets/Sound.png')} style={{ width: 35, height: 35 }} />
                  <Text style={styles.iconLabel}>Sound</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setEditMode(false); setSelectedBoxId(null); }}>
                  <Image source={require('./assets/Exit.png')} style={{ width: 35, height: 35 }} />
                  <Text style={styles.iconLabel}>Exit</Text>
                </TouchableOpacity>
              </View>

              {(() => {
                const totalLength = timelineLengthsPerBox[selectedBoxId!] || 1;
                const isShort = totalLength <= 15;

                const effectivePixelsPerSecond = isShort
                  ? containerWidth > 0
                    ? containerWidth / totalLength
                    : screenWidth / totalLength
                  : PIXELS_PER_SECOND;

                const currentTime = Math.max(
                  0,
                  (scrollX + containerWidth / 2) / effectivePixelsPerSecond
                );

                const contentWidth = totalLength * effectivePixelsPerSecond;

                return (
                  <>
                    {/* Zeit oben */}
                    <View style={{ alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ color: '#fff', fontSize: 16 }}>
                        Sekunde: {currentTime.toFixed(2)}
                      </Text>
                    </View>

                    {/* Timeline-Container mit Playhead */}
                    <View
                      style={styles.timelineContainer}
                      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
                    >
                      <View style={styles.playheadLine} />

                      <ScrollView
                        horizontal
                        ref={scrollViewRef}
                        scrollEventThrottle={16}
                        onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
                        showsHorizontalScrollIndicator
                        contentContainerStyle={{ paddingVertical: 10 }}
                      >
                        <View style={{ flexDirection: 'column', width: contentWidth }}>
                          {/* 💡 Lichteffekte */}
                          <Text style={styles.groupLabel}>💡 Lichteffekte</Text>
                          {[0, 1, 2, 3].map((layer) => (
                            <View key={`L${layer}`} style={styles.timelineRow}>
                              {(() => {
                                let prevEnd = 0;
                                return sortedLight
                                  .filter((s) => s.layer === layer)
                                  .sort((a, b) => a.start - b.start)
                                  .map((seg, i) => {
                                    const gap = seg.start - prevEnd;
                                    const dur = seg.end - seg.start;
                                    prevEnd = seg.end;

                                    return (
                                      <React.Fragment key={seg.id}>
                                        {gap > 0 && (
                                          <View
                                            style={{
                                              width:
                                                (gap / totalLength) * contentWidth,
                                            }}
                                          />
                                        )}
                                        <TouchableOpacity
                                          style={[
                                            styles.timelineBlock,
                                            {
                                              width:
                                                (dur / totalLength) * contentWidth,
                                              backgroundColor:
                                                segmentColors[i % segmentColors.length],
                                            },
                                          ]}
                                          onPress={() =>
                                            setSelectedSegment({
                                              type: 'light',
                                              boxId: selectedBoxId!,
                                              id: seg.id,
                                            })
                                          }
                                        >
                                          <Text style={styles.blockText}>{seg.light}</Text>
                                        </TouchableOpacity>
                                      </React.Fragment>
                                    );
                                  });
                              })()}
                            </View>
                          ))}

                          {/* 🔊 Soundeffekte */}
                          <Text style={styles.groupLabel}>🔊 Soundeffekte</Text>
                          {[0, 1, 2, 3].map((layer) => (
                            <View key={`S${layer}`} style={styles.timelineRow}>
                              {(() => {
                                let prevEnd = 0;
                                return sortedSound
                                  .filter((s) => s.layer === layer)
                                  .sort((a, b) => a.start - b.start)
                                  .map((seg, i) => {
                                    const gap = seg.start - prevEnd;
                                    const dur = seg.end - seg.start;
                                    prevEnd = seg.end;

                                    return (
                                      <React.Fragment key={seg.id}>
                                        {gap > 0 && (
                                          <View
                                            style={{
                                              width:
                                                (gap / totalLength) * contentWidth,
                                            }}
                                          />
                                        )}
                                        <TouchableOpacity
                                          style={[
                                            styles.timelineBlock,
                                            {
                                              width:
                                                (dur / totalLength) * contentWidth,
                                              backgroundColor:
                                                segmentColors[i % segmentColors.length],
                                            },
                                          ]}
                                          onPress={() =>
                                            setSelectedSegment({
                                              type: 'sound',
                                              boxId: selectedBoxId!,
                                              id: seg.id,
                                            })
                                          }
                                        >
                                          <Text style={styles.blockText}>{seg.sound}</Text>
                                        </TouchableOpacity>
                                      </React.Fragment>
                                    );
                                  });
                              })()}
                            </View>
                          ))}

                          {/* 🌀 3D-Effekte */}
                          <Text style={styles.groupLabel}>🌀 3D-Effekte</Text>
                          {[0, 1, 2, 3].map((layer) => (
                            <View key={`D${layer}`} style={styles.timelineRow}>
                              {(() => {
                                let prevEnd = 0;
                                return sorted3D
                                  .filter((s) => s.layer === layer)
                                  .sort((a, b) => a.start - b.start)
                                  .map((seg, i) => {
                                    const gap = seg.start - prevEnd;
                                    const dur = seg.end - seg.start;
                                    prevEnd = seg.end;

                                    return (
                                      <React.Fragment key={seg.id}>
                                        {gap > 0 && (
                                          <View
                                            style={{
                                              width:
                                                (gap / totalLength) * contentWidth,
                                            }}
                                          />
                                        )}
                                        <TouchableOpacity
                                          style={[
                                            styles.timelineBlock,
                                            {
                                              width:
                                                (dur / totalLength) * contentWidth,
                                              backgroundColor:
                                                segmentColors[i % segmentColors.length],
                                            },
                                          ]}
                                          onPress={() =>
                                            setSelectedSegment({
                                              type: 'three_d',
                                              boxId: selectedBoxId!,
                                              id: seg.id,
                                            })
                                          }
                                        >
                                          <Text style={styles.blockText}>{seg.model}</Text>
                                        </TouchableOpacity>
                                      </React.Fragment>
                                    );
                                  });
                              })()}
                            </View>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  </>
                );
              })()}
            </View>
           )}

            {/* Licht Modal */}
            {editLichtEffekte && (
              <View style={styles.editLichtEffekte}>
                <View style={styles.editLichtEffekteTop} />
                <TouchableOpacity onPress={() => { setEditLichtEffekte(false); } } style={{ alignSelf: 'center' }}>
                  <Image
                    source={require('./assets/Exit.png')}
                    style={{ width: 35, height: 35 }} />
                </TouchableOpacity>
                {/* 1 ScrollView für alle Effekte */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 10, alignItems: 'center' }}
                >
                  {/* Eigene Effekte */}
                  {customLightEffects.map(effect => (
                    <Pressable
                      key={effect.name}
                      style={[styles.editButton, { borderColor: '#3E7B27' }]}
                      onPress={() => {
                        const now = Date.now();
                        const last = lastCustomTapRef.current[effect.name] || 0;
                        if (now - last < DOUBLE_PRESS_DELAY) {
                          // Double-Tap → löschen
                          Alert.alert(
                            'Effekt löschen?',
                            `Soll "${effect.name}" wirklich entfernt werden?`,
                            [
                              { text: 'Abbrechen', style: 'cancel' },
                              {
                                text: 'Löschen',
                                style: 'destructive',
                                onPress: () => {
                                  setCustomLightEffects(prev => prev.filter(e => e.name !== effect.name)
                                  );
                                  setSelectedLight(null);
                                },
                              },
                            ]
                          );
                        } else {
                          // Single-Tap → auswählen
                          setSelectedLight(effect.name);
                        }
                        lastCustomTapRef.current[effect.name] = now;
                      } }
                    >
                      <Text style={styles.buttonText}>{effect.name}</Text>
                    </Pressable>
                  ))}

                  {/* „+“-Button zum Anlegen neuer Effekte */}
                  <TouchableOpacity
                    style={[styles.editButton, { backgroundColor: '#3E7B27' }]}
                    onPress={() => setShowNewLightModal(true)}
                  >
                    <Text style={[styles.buttonText, { color: '#fff' }]}>+</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}
            {/* Licht inputs */}
            {selectedLight && (
              <Modal
                visible={!!selectedLight}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedLight(null)}
              >
                <View style={styles.modalOverlay}>
                  <Text style={styles.selectedText}>Ausgewählt: {selectedLight}</Text>
                  <Text style={styles.selectedText}>Beschreibung: {customLightEffects.find(e => e.name === selectedLight)?.desc}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Startzeit bis 10 Millisekunden"
                    placeholderTextColor="#0a0a0a"
                    value={startTimeLight}
                    onChangeText={text => setStartTimeLight(formatOneDecimal(text))}
                    keyboardType="numeric" />
                  <TextInput
                    style={styles.input}
                    placeholder="Endzeit bis 10 Millisekunden"
                    placeholderTextColor="#0a0a0a"
                    value={endTimeLight}
                    onChangeText={text => setEndTimeLight(formatOneDecimal(text))}
                    keyboardType="numeric" />
                  <View style={styles.modalButtonRow}>
                    <TouchableOpacity style={[styles.buttonNo, styles.modalButton]} onPress={() => setSelectedLight(null)}>
                      <Text style={styles.buttonText}>Schließen</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.buttonYes, styles.modalButton]} onPress={handleConfirmLight}>
                      <Text style={styles.buttonText}>Okay</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            )}

            {/* Sound Auswahl Module */}
            {editSoundEffekte && (
              <View style={styles.editLichtEffekte}>
                <View style={styles.editLichtEffekteTop} />
                <TouchableOpacity onPress={() => { setEditSoundEffekte(false); } } style={{ alignSelf: 'center' }}>
                  <Image
                    source={require('./assets/Exit.png')}
                    style={{ width: 35, height: 35 }} />
                </TouchableOpacity>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {builtInSounds.map(s => (
                    <TouchableOpacity
                      key={s.name}
                      style={styles.editButton}
                      onPress={() => loadBuiltInSound(s.name, s.file, s.description)} // 👈 file wird übergeben
                    >
                      <Text style={styles.buttonText}>{s.name}</Text>
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity
                    style={[styles.editButton, { backgroundColor: '#3E7B27' }]}
                    onPress={handleImportSound}
                  >
                    <Text style={styles.buttonText}>Import</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}

            {/* Sounds inputs*/}
            {selectedSound && (
              <Modal
                visible={!!selectedSound}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedSound(null)}
              >
                <View style={styles.modalOverlay}>
                <Text style={styles.selectedText}>Name: {selectedSound}</Text>
                <Text style={styles.selectedText}>Beschreibung: {selectedSoundDescription}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Startzeit (s)"
                  placeholderTextColor="#0a0a0a"
                  value={startTimeSound}
                  onChangeText={text => setStartTimeSound(formatOneDecimal(text))}
                  keyboardType="numeric" />

                <Text style={styles.selectedText}>
                  Ende: {startTimeSound
                    ? (Number(startTimeSound) + soundDuration).toFixed(2)
                    : '—'} s
                </Text>
                <Text style={styles.selectedText}>Lautstärke in %:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Lautstärke (0–100)"
                  placeholderTextColor="#0a0a0a"
                  value={String(selectedSoundVolume)}
                  onChangeText={text => {
                    const v = Number(text.replace(/[^0-9]/g, ''));
                    setSelectedSoundVolume(v > 100 ? 100 : v < 0 ? 0 : v);
                  } }
                  keyboardType="numeric" />
                {selectedSound && (
                  <Text style={styles.selectedText}>Dateipfad: {selectedSound}</Text>
                )}
                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    style={[styles.buttonNo, styles.modalButton]}
                    onPress={() => setSelectedSound(null)}
                  >
                    <Text style={styles.buttonText}>Schließen</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.buttonYes, styles.modalButton]}
                    onPress={handleConfirmSound}
                  >
                    <Text style={styles.buttonText}>Okay</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            )}

            {edit3DEffekte && (
              <View style={styles.editLichtEffekte}>
                <View style={styles.editLichtEffekteTop}>
                  <TouchableOpacity onPress={() => { setEdit3DEffekte(false); } } style={{ alignSelf: 'center' }}>
                    <Image
                      source={require('./assets/Exit.png')}
                      style={{ width: 35, height: 35 }} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.editButton} onPress={() => setSelected3D('Nebel')}>
                    <Text style={styles.buttonText}>Nebel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.editButton} onPress={() => setSelected3D('Spinn')}>
                    <Text style={styles.buttonText}>Spinn</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {/* Editor für Nebel */}
            {selected3D === 'Nebel' && (
              <Modal
                visible={!!selected3D}
                transparent
                animationType="slide"
                onRequestClose={() => setSelected3D(null)}
              >
                <View style={styles.modalOverlay}>
                <Text style={styles.selectedText}>Nebel Effekt bearbeiten</Text>

                <Text>Startzeit (Sekunden)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={startTime3D}
                  onChangeText={text => setStartTime3D(formatOneDecimal(text))}
                  placeholder="Startzeit" />

                <Text>Endzeit (Sekunden)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={endTime3D}
                  onChangeText={text => setEndTime3D(formatOneDecimal(text))}
                  placeholder="Endzeit" />

                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    style={[styles.buttonNo, styles.modalButton]}
                    onPress={() => setSelected3D(null)}
                  >
                    <Text style={styles.buttonText}>Abbrechen</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.buttonYes, styles.modalButton]}
                    onPress={handleConfirm3D}
                  >
                    <Text style={styles.buttonText}>Speichern</Text>
                  </TouchableOpacity>
                </View>
              </View>
             </Modal>
            )}

            {/* Editor für Spinn */}
            {selected3D === 'Spinn' && (
              <Modal
                visible={!!selected3D}
                transparent
                animationType="slide"
                onRequestClose={() => setSelected3D(null)}
              >
                <View style={styles.modalOverlay}>
                <Text style={styles.modalTitle}>Spinn Effekt bearbeiten</Text>

                <Text>Startzeit (Sekunden)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={startTime3D}
                  onChangeText={text => setStartTime3D(formatOneDecimal(text))}
                  placeholder="Startzeit" />

                <Text>Endzeit (Sekunden)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={endTime3D}
                  onChangeText={text => setEndTime3D(formatOneDecimal(text))}
                  placeholder="Endzeit" />

                {/* Links / Rechts Umschalter */}
                <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ flex: 1 }}>Drehrichtung:</Text>
                  <Text style={{ marginRight: 10 }}>{rotateRight ? 'Rechts' : 'Links'}</Text>
                  <Switch
                    value={rotateRight}
                    onValueChange={setRotateRight} />
                </View>

                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    style={[styles.buttonNo, styles.modalButton]}
                    onPress={() => setSelected3D(null)}
                  >
                    <Text style={styles.buttonText}>Abbrechen</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.buttonYes, styles.modalButton]}
                    onPress={handleConfirm3D}
                  >
                    <Text style={styles.buttonText}>Speichern</Text>
                  </TouchableOpacity>
                </View>
              </View>
              </Modal>
            )}



            {showNewLightModal && (
              <Modal
                visible
                transparent
                animationType="slide"
                onRequestClose={() => setShowNewLightModal(false)}
              >
                <View style={styles.modalBackdrop}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Neuer Lichteffekt</Text>

                    <TextInput
                      style={styles.input}
                      placeholder="Name des Effekts"
                      placeholderTextColor="#0a0a0a"
                      value={newLightName}
                      onChangeText={setNewLightName} />
                    <TextInput
                      style={styles.input}
                      placeholder="Beschreibung"
                      placeholderTextColor="#0a0a0a"
                      value={newLightDesc}
                      onChangeText={setNewLightDesc} />

                    <Text style={{ marginTop: 10 }}>Lichter:</Text>
                    <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginTop: 5 }}>
                      <Picker
                        selectedValue={newLightColor}
                        onValueChange={(itemValue) => setNewLightColor(itemValue)}
                        dropdownIconColor="#000"
                        style={{color: 'black'}}
                      >
                        <Picker.Item label="Flutlicht" value="Flutlicht" />
                        <Picker.Item label="Licht Rot" value="Licht Rot" />
                        <Picker.Item label="Licht Gelb" value="Licht Gelb" />
                        <Picker.Item label="Licht Blau" value="Licht Blau" />
                        <Picker.Item label="Licht Grün" value="Licht Grün" />
                        <Picker.Item label="Pinspots Rot" value="Pinspots Rot" />
                        <Picker.Item label="Pinspots Blau" value="Pinspots Blau" />
                        <Picker.Item label="Pinspots Grün" value="Pinspots Grün" />
                      </Picker>
                    </View>

                    <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ flex: 1 }}>Blinken aktivieren</Text>
                      <TouchableOpacity
                        style={[styles.button3, { backgroundColor: isBlinking ? '#3E7B27' : '#ccc' }]}
                        onPress={() => setIsBlinking(!isBlinking)}
                      >
                        <Text style={styles.buttonText}>{isBlinking ? 'Ja' : 'Nein'}</Text>
                      </TouchableOpacity>
                    </View>

                    <TextInput
                      style={[styles.input, { backgroundColor: isBlinking ? '#f5f5f5' : '#ddd' }]}
                      placeholder="Periode"
                      placeholderTextColor="#0a0a0a"
                      value={blinkFrequency}
                      onChangeText={setBlinkFrequency}
                      keyboardType="numeric"
                      editable={isBlinking} />

                    {/* Rechts / Links Auswahl */}
                    <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.directionLabel}>
                        {rotateRight ? 'Rechts' : 'Links'}
                      </Text>
                      <Switch
                        value={rotateRight}
                        onValueChange={setRotateRight} />
                    </View>
                    <Text style={{ marginTop: 10 }}>Nummer: {currentLightNumber ?? 'Nicht verfügbar'}</Text>

                    <View style={styles.modalButtonRow}>
                      <TouchableOpacity
                        style={[styles.buttonNo, styles.modalButton]}
                        onPress={() => setShowNewLightModal(false)}
                      >
                        <Text style={styles.buttonText}>Abbrechen</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.buttonYes, styles.modalButton]}
                        onPress={() => {
                          if (!newLightName.trim()) {
                            Alert.alert('Name fehlt', 'Bitte gib einen Namen für den Effekt ein.');
                            return;
                          }

                          // Pin aus pinMap holen
                          const pins = pinMap[newLightColor]; // newLightColor ist die gewählte Farbe im Picker
                          const pinStr = pins ? (rotateRight ? pins.R : pins.L) : 'XX';
                          const pin = pinStr === 'XX' ? undefined : parseInt(pinStr, 10);

                          setCustomLightEffects(prev => [
                            ...prev,
                            {
                              name: newLightName,
                              desc: newLightDesc,
                              color: newLightColor,
                              blinking: isBlinking
                                ? { freq: blinkFrequency, on: blinkOnDuration }
                                : undefined,
                              rotateRight,
                              pin, // Hier wird der Pin mitgespeichert
                            },
                          ]);

                          // Reset
                          setShowNewLightModal(false);
                          setNewLightName('');
                          setNewLightDesc('');
                          setNewLightColor('Flutlicht');
                          setIsBlinking(false);
                          setBlinkFrequency('');
                          setBlinkOnDuration('');
                          setRotateRight(true);
                        } }
                      >

                        <Text style={styles.buttonText}>Speichern</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            )}

            {selectedSegment && (
              <Modal
                visible
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedSegment(null)}
              >
                <View style={styles.modalBackdrop}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>
                      Effekt bearbeiten oder löschen
                    </Text>

                    <View style={styles.modalButtonRow}>
                      <TouchableOpacity
                        style={[styles.button3, styles.modalButton]}
                        onPress={() => handleEditSegment()}
                      >
                        <Text style={styles.buttonText}>Bearbeiten</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.button3, styles.modalButton]}
                        onPress={() => handleDeleteSegment()}
                      >
                        <Text style={styles.buttonText}>Löschen</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.button3, styles.modalButton]}
                        onPress={() => setSelectedSegment(null)}
                      >
                        <Text style={styles.buttonText}>Abbrechen</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            )}

            {connectUi && (
              <View style={styles.container}>
                <Text style={styles.header}>Bluetooth Classic Example</Text>
                <Button title="Connect to Raspberry Pi" onPress={() => connectToPi(setConnectedDevice, setMessage)} />
                {/*Verbindungsstatus*/}
                <Text style={styles.status}>{connected ? `Connected to ${connectedDevice.name}` : 'Not connected'}</Text>

                <TouchableOpacity style={styles.button} onPress={handleStart} />
                <Button title="Connect to Raspberry Pi" onPress={() => sendMessage(connectedDevice, '4')} />
              </View>
            )}
          </SafeAreaView>
 );}
