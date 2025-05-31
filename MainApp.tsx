/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react-native/no-inline-styles */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  Button,
  Pressable,
  Modal,
  BackHandler,
  Platform,
  GestureResponderEvent,
  StatusBar,
  useWindowDimensions,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
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
import { sendMessage } from './sendMsg';
import { useBluetoothMessages } from './readMsg';
import {connectToPi} from './communicateWithPi';
import { BluetoothDevice } from 'react-native-bluetooth-classic';
import Sound from 'react-native-sound';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import { createStyles } from './styles';
// @ts-ignore falls du keine .d.ts-Datei willst
import ImmersiveMode from 'react-native-immersive';
export default function App() {
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
  const snd = new Sound(file, '', (err) => {
    if (err) {
      Alert.alert('Fehler beim Laden', err.message);
      return;
    }

    const actualDuration = snd.getDuration();

    // Zustand aktualisieren
    setSelectedSound(name);
    setSelectedSoundDescription(description);
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
  });
};




  const [builtInSounds, setBuiltInSounds] = useState<BuiltInSound[]>([
  { name: 'sound 1', file: 'sound1.wav', description: 'Test1', duration: 1 },
  { name: 'sound 2', file: 'sound2.wav', description: 'Test2', duration: 1 },
  { name: 'sound 3', file: 'sound3.wav', description: 'Test3', duration: 1 },
  { name: 'sound 4', file: 'sound4.wav', description: 'Test4', duration: 1 },
  { name: 'sound 5', file: 'sound5.wav', description: 'Test5', duration: 1 },
  { name: 'sound 6', file: 'sound6.wav', description: 'Test6', duration: 1 },
  { name: 'sound 7', file: 'sound7.wav', description: 'Test7', duration: 1 },
  { name: 'sound 8', file: 'sound8.wav', description: 'Test8', duration: 1 },
  // Füge hier einfach weitere Einträge hinzu, je nachdem wie viele .wav-Dateien du hast.
  ]);
// StatesSoundEditorEnd____________________________________________________________________________________________________________________________

const MAX_DURATION = 60;

const [showOverLengthModal, setShowOverLengthModal] = useState(false);
const [overStartTime, setOverStartTime]     = useState<number>(0);
const [overEndTime, setOverEndTime]         = useState<string>('');


function clampTime(value: number): number {
  return Math.max(0, Math.min(value, MAX_DURATION));
}

//Bluethooth_____________________________________________________________________________________________________________________________________________
const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice>(null as unknown as BluetoothDevice);
const [message, setMessage] = useState<string>('');
const { messages, connected, error} = useBluetoothMessages(connectedDevice);
// BluetoothEnd__________________________________________________________________________________________________________________________________________
// Double-Click_________________________________________________________________________________________________________________________________________

const lastTapRef = useRef<number | null>(null);
const handleNameDoubleTap = () => {
  const now = Date.now();
  const DOUBLE_PRESS_DELAY = 300; // ms bis zum nächsten Tap
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
const DOUBLE_PRESS_DELAY = 300;  // ms

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
  const [endTimeSound, setEndTimeSound] = useState('');

  const [selected3D, setSelected3D] = useState<string | null>(null);
  const [startTime3D, setStartTime3D] = useState('');
  const [endTime3D, setEndTime3D] = useState('');
  const [spinnSpeed, setSpinnSpeed] = useState('');
  const [rotateRight, setRotateRight] = useState(true);

  const [editingSegmentId, setEditingSegmentId] = useState<number | null>(null);
  const [editingSegmentType, setEditingSegmentType] = useState<'light' | 'sound' | '3D' | null>(null);

  // Timeline lengths per box
  const [timelineLengthsPerBox, setTimelineLengthsPerBox] = useState<{ [boxId: number]: number }>({});

  // Segments per effect type per box
  const [lightSegmentsPerBox, setLightSegmentsPerBox] = useState<{ [boxId: number]: LayeredSegment[] }>({});
  const [soundSegmentsPerBox, setSoundSegmentsPerBox] = useState<{ [boxId: number]: LayeredSound[] }>({});
  const [threeDSegmentsPerBox, setThreeDSegmentsPerBox] = useState<{ [boxId: number]: ThreeDSegment[] }>({});

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
  } else if (type === '3D') {
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
} else if (type === '3D') {
  const segs = threeDSegmentsPerBox[boxId] || [];
  const seg = segs.find(s => s.id === id);
  if (!seg) {return;}

  setSelected3D(seg.model);
  setStartTime3D(String(seg.start));
  setEndTime3D(String(seg.end));

  setEditingSegmentId(seg.id);
  setEditingSegmentType('3D');
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



  const handleStart = () => {
  type SeqItem = {
  type: 'light' | 'sound' | '3D' | 'gap';
  name: string;
  start: number;
  end?: number;
  blinking?: {
    freq: string;
    on?: string;
  };
  rotateRight?: boolean; // für 3D-Spinn
  volume?: number;
};

  const sequence: SeqItem[] = [];
  let globalOffset = 0;

  boxData.forEach((box, idx) => {
    // Licht
    const lightSegs = (lightSegmentsPerBox[box.id] || []).sort((a, b) => a.start - b.start);
  lightSegs.forEach(seg => {
    const blinking = customLightEffects.find(e => e.name === seg.light)?.blinking;
    sequence.push({
      type: 'light',
      name: seg.light,
      start: globalOffset + seg.start,
      end: globalOffset + seg.end,
      blinking: blinking ? { freq: blinking.freq } : undefined,// Frequenz hinzufügen
    });
  });
    // Sound
    const soundSegs = (soundSegmentsPerBox[box.id] || []).sort((a, b) => a.start - b.start);
soundSegs.forEach(seg => {
  sequence.push({
    type: 'sound',
    name: seg.sound,
    start: globalOffset + seg.start,
    volume: seg.volume,
  });
});


    // 3D
   const d3Segs = (threeDSegmentsPerBox[box.id] || []).sort((a, b) => a.start - b.start);
    d3Segs.forEach(seg => {
      sequence.push({
        type: '3D',
        name: seg.model,
        start: globalOffset + seg.start,
        end: globalOffset + seg.end,
        rotateRight: seg.model === 'Spinn' ? seg.rotateRight : undefined, // Nur bei Spinn relevant
      });
    });


    // Box-Länge oder maxEnd
    const boxEnd = timelineLengthsPerBox[box.id] ??
      Math.max(
        lightSegs.length ? Math.max(...lightSegs.map(s => s.end)) : 0,
        soundSegs.length ? Math.max(...soundSegs.map(s => s.end)) : 0,
        d3Segs.length   ? Math.max(...d3Segs.map(s => s.end))     : 0,
        0
      );
    globalOffset += boxEnd;

    // Gap
    if (idx < boxData.length - 1) {
      const gapSec = parseFloat(gapTimes[idx] || '') || 1;
      sequence.push({ type: 'gap', name: `${idx}`, start: globalOffset, end: globalOffset + gapSec });
      globalOffset += gapSec;
    }
  });

  // Baue die Lines mit Fragezeichen
const lines = sequence.map((item, i) => {
  let line = `${item.type},${item.name},${item.start.toString().padStart(4, '0')}000-${item.end.toString().padStart(4, '0')}000`;

  // Wenn Lichteffekt mit Blinken
  if (item.type === 'light' && item.blinking?.freq) {
    line += `,${item.blinking.freq}Hz`;
  }

  // Wenn 3D mit Drehrichtung
  if (item.type === '3D' && item.name === 'Spinn' && 'rotateRight' in item) {
    line += `,${item.rotateRight ? 'Rechts' : 'Links'}`;
  }

  // Wenn Sound mit Lautstärke
  if (item.type === 'sound' && 'volume' in item && item.volume !== undefined) {
    line += `,${item.volume}%`;
  }

  return i < sequence.length - 1 ? `${line}?` : line;
});


  const output = lines.join('\n');
  console.log(output);
  Alert.alert('Sequenz', output);
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

      // ⬇️ State & Speicher aktualisieren
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

  if (rawEnd > MAX_DURATION || rawEnd - rawStart > MAX_DURATION) {
    setOverStartTime(rawStart);
    setOverEndTime(endTimeLight);
    setShowOverLengthModal(true);
    return;
  }

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
    const end   = Number(endTime3D);
    const speed = selected3D === 'Spinn' ? Number(spinnSpeed) : undefined;

    // Validierung hier...

    // ─── Hier löschen wir das alte Segment ───
    if (editingSegmentType === '3D' && editingSegmentId !== null) {
      handleDeleteSegment();  // entfernt das alte Segment
    }

    // ─── Dann legen wir das neue an ───
    add3DSegment({
    model: selected3D,
    start,
    end,
    ...(speed !== undefined ? { speed } : {}),
    rotateRight: selected3D === 'Spinn' ? (rotateRight ?? false) : false,
  });


    // ─── Reset Inputs & Edit-State ───
    setStartTime3D('');
    setEndTime3D('');
    setSpinnSpeed('');
    setSelected3D(null);
  }
};


const addLightSegment = (seg: { light: string; start: number; end: number }) => {
  if (selectedBoxId === null) {return;}

  let segments = lightSegmentsPerBox[selectedBoxId] || [];

  // 👉 Debug-Ausgabe direkt hier
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

  const newSeg: LightSegment = {
    id: Date.now() + Math.random(),
    ...seg,
    layer,
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

  if (editingSegmentType === '3D' && editingSegmentId !== null) {
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
// FileImport_____________________________________________________________________________________________________________________________________________________
  const importFile = async () => {
    try {
      // Datei auswählen
      const [picked] = await pick({
        type: [types.allFiles],
        multiple: false,
      });

      // Lokale Kopie anlegen
      const [localRes] = await keepLocalCopy({
        files: [{ uri: picked.uri, fileName: picked.name ?? 'unknown' }],
        destination: 'documentDirectory',
      });

      // Status-basiertes Handling
      if (localRes.status === 'success') {
        Alert.alert(
          'Import erfolgreich',
          `Name: ${picked.name}\nGröße: ${picked.size ?? 'unbekannt'} Bytes\n\nLokaler Pfad:\n${localRes.localUri}`
        );
      } else {
        console.error('Fehler beim Kopieren:', localRes.copyError);
        Alert.alert('Fehler', `Lokale Kopie fehlgeschlagen: ${localRes.copyError}`);
      }
    } catch (err: unknown) {
      // Abbruch/Fehler behandeln
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
        console.log('Auswahl abgebrochen');
      } else {
        console.error('Fehler beim Import:', err);
        Alert.alert('Fehler', (err as Error).message ?? 'Unbekannter Fehler');
      }
    }
  };
// FileImportEnd__________________________________________________________________________________________________________________________________________________
// Sounds_________________________________________________________________________________________________________________________________________________________

// SoundsEnd______________________________________________________________________________________________________________________________________________________
// Delete_Function________________________________________________________________________________________________________________________________________________
  const handleDeleteSelected = () => {
    if (selectedBoxId === null) {return;}

    // Index der Box im Array
    const idx = boxData.findIndex(b => b.id === selectedBoxId);
    if (idx === -1) {return;}

    // 1) Box entfernen
    setBoxData(prev => prev.filter(b => b.id !== selectedBoxId));

    // 2) Alle zugehörigen Daten aufräumen
    setTimelineLengthsPerBox(prev => {
      const { [selectedBoxId]: _, ...rest } = prev;
      return rest;
    });
    setLightSegmentsPerBox(prev => {
      const { [selectedBoxId]: _, ...rest } = prev;
      return rest;
    });
    setSoundSegmentsPerBox(prev => {
      const { [selectedBoxId]: _, ...rest } = prev;
      return rest;
    });
    setThreeDSegmentsPerBox(prev => {
      const { [selectedBoxId]: _, ...rest } = prev;
      return rest;
    });

    // 3) Falls direkt rechts eine Lücke existiert, diese ebenfalls löschen
    setGapTimes(prev => {
      const newGaps: { [i: number]: string } = {};
      Object.entries(prev).forEach(([key, val]) => {
        const k = Number(key);
        if (k < idx) {
          // Lücken vor der gelöschten Box behalten, Index bleibt gleich
          newGaps[k] = val;
        } else if (k > idx) {
          // Lücken nach der gelöschten Box um 1 nach links verschieben
          newGaps[k - 1] = val;
        }
        // k === idx (direkt rechts der gelöschten Box) fällt raus
      });
      return newGaps;
    });

    // 4) Auswahl zurücksetzen
    setSelectedBoxId(null);
  };
// Delete_FunctionEnd_____________________________________________________________________________________________________________________________________________
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
  type: 'light' | 'sound' | '3D';
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
const [isBlinking, setIsBlinking] = useState(false);
const [blinkFrequency, setBlinkFrequency] = useState('');
const [blinkOnDuration, setBlinkOnDuration] = useState('');

// Am Anfang deines App-Komponents
const [customLightEffects, setCustomLightEffects] = useState<{
  name: string;
  desc: string;
  color: string;
  blinking?: { freq: string; on: string };
}[]>([]);
// Delete
// oberhalb deiner return()
const lastCustomTapRef = useRef<{ [key: string]: number }>({});
// DeleteEnd
// NewLigthEffektEnd______________________________________________________________________________________________________________________________________________
 return (
<>
<SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, flex: 1 }]}>
  <StatusBar
  translucent={true}               // Inhalt geht hinter die Statusleiste
  backgroundColor="#000000"   // Macht sie durchsichtig (Android)
  barStyle="light-content"        // Weißer Text (optional)
/>
      {/* Header */}
      <View style={styles.header}>
        <Button title="Exit" onPress={handleExit} color={'#3E7B27'}/>
        <Button title="Start" onPress={handleStart} color={'#3E7B27'}/>
        <Button title="Connect" onPress={() =>setconnectUi(true)} color={'#3E7B27'}/>
      </View>

      {/* ScrollContainer */}
      <View style={styles.scrollContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={event => {
            const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
            const barWidth = contentSize.width > 0 ? (layoutMeasurement.width / contentSize.width) * layoutMeasurement.width : 0;
            const barPos = (contentOffset.x / (contentSize.width - layoutMeasurement.width)) * (layoutMeasurement.width - barWidth);
            setScrollBarWidth(barWidth);
            setScrollPosition(barPos);
          }}
          scrollEventThrottle={16}
        >
          {boxData.map((box, index) => (
            <React.Fragment key={box.id}>
              <Pressable
                style={[styles.box, selectedBoxId === box.id && styles.selectedBox]}
                onPress={() => {
                  setSelectedBoxId(box.id);
                  setEditMode(false);
                  setEditLichtEffekte(false);
                  setEditSoundEffekte(false);
                  setEdit3DEffekte(false);
                }}
                onPressIn={() => handleBlockDoubleTap(box.id)}
              >
                <Text>{box.name}</Text>
                <Text style={{ fontSize: 12, color: '#555' }}>
                  Länge: {timelineLengthsPerBox[box.id] ?? 0}s
                </Text>
              </Pressable>
              {index < boxData.length - 1 && (
                <TouchableOpacity
                  style={styles.smallBox}
                  onPress={() => {
                    setGapTimes(prev => ({ ...prev, [index]: prev[index] ?? '1' }));
                    setSelectedGapIndex(index);
                    openGapModal(index);
                  }}
                >
                  <Text style={styles.smallBoxText}>
                    {gapTimes[index] ? `${gapTimes[index]}s` : '1s'}
                  </Text>
                </TouchableOpacity>
              )}
            </React.Fragment>
          ))}
        <TouchableOpacity
          style={styles.plusButton}
          onPress={() =>
            setBoxData(prev => {
              const maxId = prev.reduce((m, b) => Math.max(m, b.id), 0);
              const newId = maxId + 1;
              return [
                ...prev,
                { id: newId, name: `Effekt ${newId}` },
              ];
            })
          }
        >
          <Text style={styles.plusText}>+</Text>
        </TouchableOpacity>


        </ScrollView>
        <View style={styles.scrollBarContainer}>
          <View style={[styles.scrollBar, { width: scrollBarWidth, left: scrollPosition }]} />
        </View>
      </View>

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
          }}
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
                onChangeText={text =>
                  setGapTempValue(formatOneDecimal(text))
                }
              />

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
                  }}
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
                  }}
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
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Timeline-Länge einstellen</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={lengthTempValue}
              onChangeText={text =>
                setLengthTempValue(text.replace(/[^0-9.]/g, ''))
              }
              placeholder="Sekunden"
              placeholderTextColor="#0a0a0a"
            />
            <View style={styles.modalButtonRow}>
              {/* Bestätigen */}
              <TouchableOpacity
                style={[styles.buttonYes, styles.modalButton]}
                onPress={() => {
                  let num = parseFloat(lengthTempValue);
                  // Fallback, falls Eingabe ungültig
                  if (isNaN(num)) {num = parseFloat(lengthInitialValue) || 0;}
                  // Obergrenze 60 s
                  if (num > 60) {num = 60;}
                  // ggf. auch Untergrenze
                  if (num < 0) {num = 0;}

                  setTimelineLengthsPerBox(prev => ({
                    ...prev,
                    [selectedBoxId!]: num,
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
                }}
              >
                <Text style={styles.buttonText}>Zurück</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      )}

      {/* Overlap Moduls */}
      {overlapModalLight && (
        <View style={styles.modalOverlay}>
          <Text style={styles.modalText}>Überlappung der Lichteffekte. Akzeptieren passt bestehende an!</Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.button3} onPress={() => setOverlapModalLight(false)}>
              <Text style={styles.buttonText}>Abbrechen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button3} onPress={() => setOverlapModalLight(false)}>
              <Text style={styles.buttonText}>Akzeptieren</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {overlapModalSound && (
        <View style={styles.modalOverlay}>
          <Text style={styles.modalText}>Überlappung der Soundeffekte. Akzeptieren passt bestehende an!</Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.button3} onPress={() => setOverlapModalSound(false)}>
              <Text style={styles.buttonText}>Abbrechen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button3} onPress={() => setOverlapModalSound(false)}>
              <Text style={styles.buttonText}>Akzeptieren</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {overlapModal3D && (
        <View style={styles.modalOverlay}>
          <Text style={styles.modalText}>Überlappung der 3D-Effekte. Akzeptieren passt bestehende an!</Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.button3} onPress={() => setOverlapModal3D(false)}>
              <Text style={styles.buttonText}>Abbrechen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button3} onPress={() => setOverlapModal3D(false)}>
              <Text style={styles.buttonText}>Akzeptieren</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Second Header */}
      <View style={styles.secoundheader}>
        <Button title="Laden" onPress={handleSuchen} color={'#3E7B27'}/>
        <Button title="Save" onPress={handleSave} color={'#3E7B27'}/>
      </View>

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
              onChangeText={setSaveName}
            />
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


      {selectedBoxId !== null && !showRenameModal && (
        <View style={styles.selectedMenu}>
          {/* Doppel-Tap auf den Namen */}
          <Pressable onPress={handleNameDoubleTap}>
            <Text style={styles.selectedTextDoubleTap}>
              {`"${boxData.find(b => b.id === selectedBoxId)?.name}"`}
            </Text>
          </Pressable>

          {/* Optional: weiter Bearbeiten-Button, der das gleiche Modal öffnet */}
          <TouchableOpacity
            style={styles.button3}
            onPress={() => {
              const currentName = boxData.find(b => b.id === selectedBoxId!)?.name || '';
              setRenameValue(currentName);
              setEditMode(true);
            }}
          >
            <Text style={styles.buttonText}>Bearbeiten</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button3} onPress={handleDeleteSelected}>
            <Text style={styles.buttonText}>Löschen</Text>
          </TouchableOpacity>
        </View>
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
              placeholderTextColor="#0a0a0a"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button3, styles.modalButton]}
                onPress={() => {
                  // Speichern
                  setBoxData(prev =>
                    prev.map(b =>
                      b.id === selectedBoxId ? { ...b, name: renameValue } : b
                    )
                  );
                  setShowRenameModal(false);
                }}
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
          <View style={styles.editMenuTop}>
            <TouchableOpacity style={styles.editButton} onPress={() => {setEditLichtEffekte(true); setEditSoundEffekte(false); setEdit3DEffekte(false);}}>
              <Icon name="lightbulb-outline" size={30} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.editButton} onPress={() => {setEditSoundEffekte(true); setEditLichtEffekte(false); setEdit3DEffekte(false);}}>
              <Icon name="music-note" size={30} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.editButton} onPress={() => {setEdit3DEffekte(true); setEditLichtEffekte(false); setEditSoundEffekte(false);}}>
              <Icon name="dashboard" size={30} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.editButton} onPress={() => { setEditMode(false); setSelectedBoxId(null); setEditLichtEffekte(false); setEditSoundEffekte(false); setEdit3DEffekte(false); }}>
              <Text style={styles.buttonText}>Exit</Text>
            </TouchableOpacity>
          </View>
        <View style={styles.scrollContainerBalken}>
        <ScrollView
          ref={scrollViewRef}
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={1}
          contentContainerStyle={{
            paddingBottom: Platform.OS === 'android' ? 45 : 0,
          }}
        >
              {/* Segment-Balken für Licht */}
                  <Text style={styles.label}>Lichteffekte</Text>
        {[0, 1, 2, 3].map(layer => (
          <View key={`light-layer-${layer}`} style={styles.segmentContainer}>
            {(() => {
              const tlLength = timelineLengthsPerBox[selectedBoxId] || 1;
              const layerSegs = sortedLight.filter(s => s.layer === layer);
              let prevEnd = 0;
              const elems: any[] = [];

              layerSegs.sort((a, b) => a.start - b.start).forEach((seg, i) => {
                const gap = seg.start - prevEnd;
                if (gap > 0) {elems.push(<View key={`gap-light-${layer}-${i}`} style={{ flex: gap / tlLength }} />);}
                elems.push(
                  <TouchableOpacity
                    key={`seg-light-${layer}-${i}`}
                    style={[styles.segmentBar, {
                      flex: (seg.end - seg.start) / tlLength,
                      backgroundColor: segmentColors[i % segmentColors.length],
                    }]}
                    onPress={() =>
                      setSelectedSegment({ type: 'light', boxId: selectedBoxId!, id: seg.id })
                    }
                  >
                    <Text style={styles.segmentText}>{seg.light}</Text>
                  </TouchableOpacity>

                );
                prevEnd = seg.end;
              });
              return elems;
            })()}
          </View>
        ))}
              {/* Segment-Balken für Sound */}
                  <Text style={styles.label}>Soundeffekte</Text>
        {[0, 1, 2, 3].map(layer => (
          <View key={`sound-layer-${layer}`} style={styles.segmentContainer}>
            {(() => {
              const tlLength = timelineLengthsPerBox[selectedBoxId] || 1;
              const layerSegs = sortedSound.filter(s => s.layer === layer);
              let prevEnd = 0;
              const elems: any[] = [];

              layerSegs.sort((a, b) => a.start - b.start).forEach((seg, i) => {
                const gap = seg.start - prevEnd;
                if (gap > 0) {elems.push(<View key={`gap-sound-${layer}-${i}`} style={{ flex: gap / tlLength }} />);}
                elems.push(
                  <TouchableOpacity
                    key={`seg-sound-${layer}-${i}`}
                    style={[styles.segmentBar, {
                      flex: (seg.end - seg.start) / tlLength,
                      backgroundColor: segmentColors[i % segmentColors.length],
                    }]}
                    onPress={() =>
                      setSelectedSegment({ type: 'sound', boxId: selectedBoxId!, id: seg.id })
                    }
                  >
                    <Text style={styles.segmentText}>{seg.sound}</Text>
                  </TouchableOpacity>
                );
                prevEnd = seg.end;
              });
              return elems;
            })()}
          </View>
        ))}

               {/* Segment-Balken für Sound */}
                  <Text style={styles.label}>3D Effekte</Text>
        {[0, 1, 2, 3].map(layer => (
          <View key={`3D-layer-${layer}`} style={styles.segmentContainer}>
            {(() => {
              const tlLength = timelineLengthsPerBox[selectedBoxId] || 1;
              const layerSegs = sorted3D.filter(s => s.layer === layer);
              let prevEnd = 0;
              const elems: any[] = [];

              layerSegs.sort((a, b) => a.start - b.start).forEach((seg, i) => {
                const gap = seg.start - prevEnd;
                if (gap > 0) {elems.push(<View key={`gap-3D-${layer}-${i}`} style={{ flex: gap / tlLength }} />);}
                elems.push(
                  <TouchableOpacity
                    key={`seg-3D-${layer}-${i}`}
                    style={[styles.segmentBar, {
                      flex: (seg.end - seg.start) / tlLength,
                      backgroundColor: segmentColors[i % segmentColors.length],
                    }]}
                    onPress={() =>
                      setSelectedSegment({
                        type: '3D',
                        boxId: selectedBoxId!,
                        id: seg.id,
                      })
                    }
                  >
                    <Text style={styles.segmentText}>
                      {seg.model}
                    </Text>
                  </TouchableOpacity>
                );
                prevEnd = seg.end;
              });
              return elems;
            })()}
          </View>
        ))}
  </ScrollView>
</View>
        </View>
      )}

                    {/* Licht Modal */}
                    {editLichtEffekte && (
        <View style={styles.editLichtEffekte}>
          {/* Kopfzeile mit Exit-Button */}
          <View style={styles.editLichtEffekteTop}>
            <TouchableOpacity style={styles.editButton} onPress={() => setEditLichtEffekte(false)}>
              <Text style={styles.buttonText}>Exit</Text>
            </TouchableOpacity>
          </View>

          {/* 1 ScrollView für alle Effekte */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 10, alignItems: 'center' }}
          >
            {/* Feste Effekte */}
            {['Licht 1', 'Licht 2', 'Licht 3', 'Licht 4'].map(light => (
              <TouchableOpacity
                key={light}
                style={styles.editButton}
                onPress={() => setSelectedLight(light)}
              >
                <Text style={styles.buttonText}>{light}</Text>
              </TouchableOpacity>
            ))}

            {/* Eigene Effekte */}
            {customLightEffects.map(effect => (
              <Pressable
                key={effect.name}
                style={[styles.editButton, { borderColor: '#3E7B27', borderWidth: 1 }]}
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
                          onPress: () =>{
                            setCustomLightEffects(prev =>
                              prev.filter(e => e.name !== effect.name)
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
                }}
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
        <View style={styles.selectedLightContainer}>
          <Text style={styles.selectedText}>Ausgewählt: {selectedLight}</Text>
          <Text style={styles.selectedText}>Beschreibung: {customLightEffects.find(e => e.name === selectedLight)?.desc}</Text>
          <TextInput
            style={styles.input}
            placeholder="Startzeit Sekunden bis .00"
            placeholderTextColor="#0a0a0a"
            value={startTimeLight}
            onChangeText={text =>setStartTimeLight(formatOneDecimal(text))}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Endzeit Sekunden bis .00"
            placeholderTextColor="#0a0a0a"
            value={endTimeLight}
            onChangeText={text => setEndTimeLight(formatOneDecimal(text))}
            keyboardType="numeric"
          />
          <View style={styles.modalButtonRow}>
            <TouchableOpacity style={[styles.button3, styles.modalButton]} onPress={() => setSelectedLight(null)}>
              <Text style={styles.buttonText}>Schließen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button3, styles.modalButton]} onPress={handleConfirmLight}>
              <Text style={styles.buttonText}>Okay</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Sound Auswahl Module */}
      {editSoundEffekte && (
        <View style={styles.editLichtEffekte}>
          <View style={styles.editLichtEffekteTop}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditSoundEffekte(false)}
            >
              <Text style={styles.buttonText}>Exit</Text>
            </TouchableOpacity>
          </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {builtInSounds.map(s => (
                <TouchableOpacity
                  key={s.name}
                  style={styles.editButton}
                  onPress={() => loadBuiltInSound(s.name, s.file, s.description)}
                >
                  <Text style={styles.buttonText}>{s.name}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: '#3E7B27  ' }]}
                onPress={handleImportSound}
              >
                <Text style={styles.buttonText}>Import</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

      {/* Sounds inputs*/}
      {selectedSound && (
        <View style={styles.selectedLightContainer}>
          <Text style={styles.selectedText}>Name: {selectedSound}</Text>
          <Text style={styles.selectedText}>Beschreibung: {selectedSoundDescription}</Text>
          <TextInput
            style={styles.input}
            placeholder="Startzeit (s)"
            placeholderTextColor="#0a0a0a"
            value={startTimeSound}
            onChangeText={text => setStartTimeSound(formatOneDecimal(text))}
            keyboardType="numeric"
          />

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
            }}
            keyboardType="numeric"
          />

          <View style={styles.modalButtonRow}>
            <TouchableOpacity
              style={[styles.button3, styles.modalButton]}
              onPress={() => setSelectedSound(null)}
            >
              <Text style={styles.buttonText}>Schließen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button3, styles.modalButton]}
              onPress={handleConfirmSound}
            >
              <Text style={styles.buttonText}>Okay</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 3D-Modal */}
      {edit3DEffekte && (
        <View style={styles.editLichtEffekte}>
          <View style={styles.editLichtEffekteTop}>
            <TouchableOpacity style={styles.editButton} onPress={() => setEdit3DEffekte(false)}>
              <Text style={styles.buttonText}>Exit</Text>
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


      {/* 3D Segment Inputs */}
      {selected3D && (
  <View style={styles.selectedLightContainer}>
    <Text style={styles.selectedText}>Ausgewählt: {selected3D}</Text>
    <TextInput
      style={styles.input}
      placeholder="Startzeit Sekunden bis .00"
      placeholderTextColor="#0a0a0a"
      value={startTime3D}
      onChangeText={text => setStartTime3D(formatOneDecimal(text))}
      keyboardType="numeric"
    />
    <TextInput
      style={styles.input}
      placeholder="Endzeit Sekunden bis .00"
      placeholderTextColor="#0a0a0a"
      value={endTime3D}
      onChangeText={text => setEndTime3D(formatOneDecimal(text))}
      keyboardType="numeric"
    />

    {selected3D === 'Spinn' && (
      <View style={styles.checkboxRow}>
        <Text style={styles.label}>Drehrichtung:</Text>
        <Text style={styles.directionLabel}>
          {rotateRight ? 'Rechts' : 'Links'}
        </Text>
        <Switch
          value={rotateRight}
          onValueChange={setRotateRight}
        />
      </View>
    )}

    <View style={styles.modalButtonRow}>
      <TouchableOpacity
        style={[styles.button3, styles.modalButton]}
        onPress={() => {
          setSelected3D(null);
          setStartTime3D('');
          setEndTime3D('');
          setSpinnSpeed('');
        }}
      >
        <Text style={styles.buttonText}>Schließen</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button3, styles.modalButton]}
        onPress={handleConfirm3D}
      >
        <Text style={styles.buttonText}>Okay</Text>
      </TouchableOpacity>
    </View>
  </View>
)}


      {ImportMode && (
        <View style={styles.ImportMode}>
          <Button title="Datei importieren" onPress={importFile} color={'#3E7B27'}/>
          <Button title="Cancel Import" onPress={() => setimportMode(false)} color={'#CD5656'}/>
        </View>
      )}

      {connectUi && (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
              <Button title="Connect to Raspberry Pi" onPress={() => connectToPi(setConnectedDevice, setMessage)} color={'#3E7B27'} />
              <Text style={styles.buttonText}>
                {connectedDevice ? `Connected to ${connectedDevice.name}` : 'Not connected'}
              </Text>
              <Text style={styles.buttonText}>{message}</Text>
              <Button title="Test" onPress={() => sendMessage(connectedDevice,'Test')} color={'#3E7B27'} />
              <Text style={styles.buttonText}>Messages: {messages.join(', ')}</Text>
              <Text style={styles.buttonText}>{connected ? 'Verbunden' : 'Nicht verbunden'}</Text>
              <Text style={styles.buttonText}>{error ? `Fehler: ${error}` : 'Kein Fehler'}</Text>
              <Button title="Schließen" onPress={ () => setconnectUi(false)} color={'#3E7B27'}/>
          </View>
        </View>
      )};
      {showOverLengthModal && (
  <Modal
    visible
    transparent
    animationType="slide"
    onRequestClose={() => setShowOverLengthModal(false)}
  >
    <View style={styles.modalBackdrop}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>
          Maximale Effektdauer ({MAX_DURATION}s) überschritten
        </Text>
        <Text style={{ marginBottom: 8 }}>
          Start: {overStartTime}s → Ende muss ≤{' '}
          {Math.min(overStartTime + MAX_DURATION, MAX_DURATION)}s sein.
        </Text>

        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={overEndTime}
          onChangeText={text => {
            const clean = text.replace(/[^0-9.]/g, '');
            setOverEndTime(clean);
          }}
          placeholder={`≤ ${Math.min(overStartTime + MAX_DURATION, MAX_DURATION)}`}
          placeholderTextColor="#0a0a0a"
        />

        <View style={styles.modalButtonRow}>
          <TouchableOpacity
            style={[styles.buttonNo, styles.modalButton]}
            onPress={() => setShowOverLengthModal(false)}
          >
            <Text style={styles.buttonText}>Abbrechen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.buttonYes, styles.modalButton]}
            onPress={() => {
              const rawEndNew = Number(overEndTime);
              // 1) Validität
              if (isNaN(rawEndNew) || rawEndNew <= overStartTime) {
                Alert.alert('Ungültig', 'Ende muss > Start sein.');
                return;
              }
              // 2) Gesamte Endzeit-Grenze prüfen
              if (rawEndNew > MAX_DURATION) {
                Alert.alert(
                  'Zu groß',
                  `Ende darf höchstens ${MAX_DURATION}s sein.`
                );
                return;
              }
              // 3) Dauer-Grenze prüfen
              if (rawEndNew - overStartTime > MAX_DURATION) {
                Alert.alert(
                  'Zu lang',
                  `Die Effektdauer darf maximal ${MAX_DURATION}s betragen.`
                );
                return;
              }

              // alles gut → Segment anlegen
              addLightSegment({
                light: selectedLight!,
                start: clampTime(overStartTime),
                end: rawEndNew,
              });
              // Reset
              setShowOverLengthModal(false);
              setSelectedLight(null);
              setStartTimeLight('');
              setEndTimeLight('');
            }}
          >
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
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
              onChangeText={setNewLightName}
            />
            <TextInput
              style={styles.input}
              placeholder="Beschreibung"
              placeholderTextColor="#0a0a0a"
              value={newLightDesc}
              onChangeText={setNewLightDesc}
            />

            <Text style={{ marginTop: 10 }}>Lichtfarbe:</Text>
            {['Rot', 'Blau', 'Weiß', 'Grün'].map(color => (
              <TouchableOpacity
                key={color}
                style={[styles.button3, {
                  backgroundColor: newLightColor === color ? '#3E7B27' : '#ccc',
                }]}
                onPress={() => setNewLightColor(color)}
              >
                <Text style={styles.buttonText}>{color}</Text>
              </TouchableOpacity>
            ))}

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
              placeholder="Frequenz (Hz)"
              placeholderTextColor="#0a0a0a"
              value={blinkFrequency}
              onChangeText={setBlinkFrequency}
              keyboardType="numeric"
              editable={isBlinking}
            />

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
                  console.log(blinkFrequency);
                   if (!newLightName.trim()) {
                    Alert.alert('Name fehlt', 'Bitte gib einen Namen für den Effekt ein.');
                    return;
      }
                  // Hier kannst du die Daten speichern oder übergeben
                  setCustomLightEffects(prev => [
                    ...prev,
                    {
                      name: newLightName,
                      desc: newLightDesc,
                      color: newLightColor,
                      blinking: isBlinking
                        ? { freq: blinkFrequency, on: blinkOnDuration }
                        : undefined,
                    },
                  ]);
                  setShowNewLightModal(false);
                  setNewLightName('');
                  setNewLightDesc('');
                  setNewLightColor('Weiß');
                  setIsBlinking(false);
                  setBlinkFrequency('');
                  setBlinkOnDuration('');
                }}
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
  </SafeAreaView>
</>
 );}
