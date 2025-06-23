/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react-native/no-inline-styles */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView as RNScrollView,
  TextInput,
  Alert,
  Pressable,
  Modal,
  BackHandler,
  Platform,
  useWindowDimensions,
  Switch,
  Image,
  Animated,
  TouchableWithoutFeedback,
  Easing,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectToPi } from './connectToPi';
import { useBluetoothMessages } from './readMsg';
import { BluetoothDevice } from 'react-native-bluetooth-classic';
import Sound from 'react-native-sound';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import { createStyles } from './styles';
import { startHandler } from './bluetoothStartHandler';
import RNFS from 'react-native-fs';
// @ts-ignore
import ImmersiveMode from 'react-native-immersive';
import { Picker } from '@react-native-picker/picker';
import StatsSwitcher from './switch';
import { sendMessage } from './sendMsg';
import ProgressBar from './ProgressBar';

function isBuiltInSound(filePath: string) {
  return !filePath.includes('/') && filePath.endsWith('.wav');
}


export default function App() {

  // ───── useEffect: Systemverhalten konfigurieren ──────────────────────────────
  useEffect(() => {
    // Hardware-Backbutton abfangen (Android)
    const onBackPress = () => {
      Alert.alert(
        'App verlassen?',
        'Willst du die App wirklich schließen?',
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Beenden', onPress: () => BackHandler.exitApp() },
        ]
      );
      return true; // Standardverhalten unterdrücken
    };

    // Listener registrieren
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    // Immersiver Vollbildmodus aktivieren
    ImmersiveMode.setImmersive(true);
    ImmersiveMode.on();

    // Navigationsleiste anpassen: transparent, helle Icons
    changeNavigationBarColor('transparent', true, true);

    // Listener entfernen bei Unmount
    return () => {
      subscription.remove();
    };
  }, []);

  // ───── Typdefinitionen für Segmente ───────────────────────────────────────────

  // Basis-Segment für gemeinsame Felder
  type BaseSegment = {
    id: number;
    start: number;
    end: number;
    layer: number;
  };

  // Licht-Effektsegment
  type LightSegment = BaseSegment & {
    light: string;
  };

  // Erweiterung für Licht mit Datei und Rotation
  type LayeredSegment = LightSegment & {
    rotateRight: boolean;
    file?: string;
  };

  // Sound-Effektsegment
  type SoundSegment = BaseSegment & {
    sound: string;
    description: string;
    volume: number;
    file?: string;
  };

  // Erweiterung für Sound
  type LayeredSound = SoundSegment;

  // 3D-Modell-Segment
  type ThreeDSegment = BaseSegment & {
    model: string;
    rotateRight: boolean;
  };

  // Erweiterung für 3D
  type Layered3D = ThreeDSegment;

  // Box (UI-Darstellung eines Elements)
  type Box = {
    id: number;
    name: string;
  };

  // Typ für eingebaute Sounds
  type BuiltInSound = {
    name: string;
    file: string;
    description: string;
    duration: number;
  };
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

  // ───── Sound initial konfigurieren ───────────────────────────────────────────
  Sound.setCategory('Playback'); // erlaubt Sound-Wiedergabe im Hintergrund

  // ───── Sound laden, Dauer auslesen und abspielen ─────────────────────────────
  const loadBuiltInSound = (
    name: string,
    file: string,
    description: string
  ) => {
    // Android benötigt Dateinamen ohne ".wav", iOS mit Extension
    const resource = Platform.OS === 'android'
      ? file.replace(/\.wav$/i, '')
      : file;

    const snd = new Sound(resource, Sound.MAIN_BUNDLE, (err) => {
      if (err) {
        Alert.alert('Fehler beim Laden', err.message);
        return;
      }

      const actualDuration = snd.getDuration();

      // Zustand im Editor setzen
      setSelectedSound(name);
      setSelectedSoundDescription(description);
      setSelectedSoundFile(file);
      setSoundDuration(actualDuration);
      setSelectedSoundVolume(100);

      // Einmal abspielen zur Kontrolle
      snd.play((success) => {
        if (!success) {
          console.warn('Sound konnte nicht abgespielt werden.');
        }
        snd.release(); // Ressourcen freigeben
      });

      // Dauer im Array der eingebauten Sounds aktualisieren
      setBuiltInSounds(prev =>
        prev.map(sound =>
          sound.name === name
            ? { ...sound, duration: actualDuration }
            : sound
        )
      );
    });
  };

  // ───── Eingebauten Sound ins temporäre Verzeichnis kopieren ─────────────────
  async function copyBuiltInSoundToTmp(fileName: string): Promise<string> {
    const tmpPath = `${RNFS.TemporaryDirectoryPath}/${fileName}`;
    try {
      await RNFS.copyFileAssets(fileName, tmpPath);
      return tmpPath;
    } catch (e) {
      console.error('Fehler beim Kopieren des Assets:', e);
      throw e;
    }
  }

  // ───── Zeitwert begrenzen ────────────────────────────────────────────────────
  function clampTime(value: number): number {
    return Math.max(0, Math.min(value, MAX_DURATION));
  }

  // ───── Länge-Modalfenster für Effekt-Box öffnen ─────────────────────────────
  const openLengthModal = (boxId: number) => {
    const current = String(timelineLengthsPerBox[boxId] ?? '');
    setLengthInitialValue(current);
    setLengthTempValue(current);
    setSelectedBoxId(boxId);
    setShowLengthModal(true);
  };

  // ───── Double-Tap auf Effekt-Block erkennen ──────────────────────────────────
  const handleBlockDoubleTap = (boxId: number) => {
    const now = Date.now();
    if (lastLengthTapRef.current && now - lastLengthTapRef.current < DOUBLE_PRESS_DELAY) {
      openLengthModal(boxId); // bei Doppeltap Modal öffnen
    }
    lastLengthTapRef.current = now;
  };

 // 📦 Effekt-Boxen
  const [boxData, setBoxData] = useState<Box[]>([
    { id: 1, name: 'Effekt 1' },
  ]);

  // 🔌 Licht-Pin-Zuordnung
  const pinMap: Record<string, { L: string; R: string }> = {
    'Licht Rot': { L: '08', R: '12' },
    'Licht Grün': { L: '07', R: '16' },
    'Licht Gelb': { L: '20', R: '20' },
    'Licht Blau': { L: '24', R: '21' },
    'Flutlicht': { L: '17', R: '27' },
    'Pinspots Rot': { L: '22', R: '11' },
    'Pinspots Grün': { L: '10', R: '05' },
    'Pinspots Blau': { L: '09', R: '06' },
  };

  // 🔊 Built-in Sounds
  const [builtInSounds, setBuiltInSounds] = useState<BuiltInSound[]>([
  { name: 'sound 1', file: 'sound1.wav', description: 'Test1', duration: 1 },
  { name: 'sound 2', file: 'sound2.wav', description: 'Test2', duration: 1 },
  { name: 'sound 3', file: 'sound3.wav', description: 'Test3', duration: 1 },
  { name: 'sound 4', file: 'sound4.wav', description: 'Test4', duration: 1 },
  { name: 'sound 5', file: 'sound5.wav', description: 'Test5', duration: 1 },
  { name: 'sound 6', file: 'sound6.wav', description: 'Test6', duration: 1 },
  { name: 'sound 7', file: 'sound7.wav', description: 'Test7', duration: 1 },
  { name: 'sound 8', file: 'sound8.wav', description: 'Test8', duration: 1 },
  { name: 'sound 9', file: 'sound9.wav', description: 'Test9', duration: 1 },
  { name: 'sound 10', file: 'sound10.wav', description: 'Test10', duration: 1 },
  { name: 'sound 11', file: 'sound11.wav', description: 'Test11', duration: 1 },
  { name: 'sound 12', file: 'sound12.wav', description: 'Test12', duration: 1 },
  { name: 'sound 13', file: 'sound13.wav', description: 'Test13', duration: 1 },
  { name: 'sound 14', file: 'sound14.wav', description: 'Test14', duration: 1 },
  { name: 'sound 15', file: 'sound15.wav', description: 'Test15', duration: 1 },
  { name: 'sound 16', file: 'sound16.wav', description: 'Test16', duration: 1 },
  { name: 'sound 17', file: 'sound17.wav', description: 'Test17', duration: 1 },
  { name: 'sound 18', file: 'sound18.wav', description: 'Test18', duration: 1 },
  { name: 'sound 19', file: 'sound19.wav', description: 'Test19', duration: 1 },
  { name: 'sound 20', file: 'sound20.wav', description: 'Test20', duration: 1 },
]);


  // 🕒 Zeit & Timeline
  const [currentTime, setCurrentTime] = useState<number>(0);
  const totalMs = Math.floor(currentTime * 1000);
  const minutes = Math.floor(totalMs / 60000).toString().padStart(2, '0');
  const seconds = Math.floor((totalMs % 60000) / 1000).toString().padStart(2, '0');
  const millis = (totalMs % 1000).toString().padStart(3, '0');

  const FIXED_WINDOW_SEC = 10;
  const PIXELS_PER_SECOND = 50;
  const DurationSec = 10;
  const timelineDurationSec = 60;
  const MAX_DURATION = 180;

  const [timelineLengthsPerBox, setTimelineLengthsPerBox] = useState<{ [boxId: number]: number }>({});
  const [remainingTime, setRemainingTime] = useState(0);

  // 🪝 Referenzen für Throttling/Timing
  const lastSetCurrentTimeRef = useRef<number>(-1);
  const lastUpdateTimeRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const THROTTLE_INTERVAL_MS = 50;

  // 📌 Playhead
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [playheadOffsetRatio, setPlayheadOffsetRatio] = useState<number>(0.5);
  const [scrollX, setScrollX] = useState(0);

  // 🔀 Auswahl/Zustand
  const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<{
    type: 'light' | 'sound' | 'three_d';
    boxId: number;
    id: number;
  } | null>(null);
  const [editingSegmentId, setEditingSegmentId] = useState<number | null>(null);
  const [editingSegmentType, setEditingSegmentType] = useState<'light' | 'sound' | 'three_d' | null>(null);

  // 🎛️ Edit-Modus & Modale
  const [editMode, setEditMode] = useState(false);
  const [editLichtEffekte, setEditLichtEffekte] = useState(false);
  const [editSoundEffekte, setEditSoundEffekte] = useState(false);
  const [edit3DEffekte, setEdit3DEffekte] = useState(false);

  // 💾 Speichern/Laden
  const [savedSequences, setSavedSequences] = useState<SequenceSave[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const SAVE_KEY = 'saved_sequences';

  // 💡 Licht-Segmenteditor
  const [selectedLight, setSelectedLight] = useState<string | null>(null);
  const [startTimeLight, setStartTimeLight] = useState('');
  const [endTimeLight, setEndTimeLight] = useState('');
  const [showNewLightModal, setShowNewLightModal] = useState(false);
  const [newLightName, setNewLightName] = useState('');
  const [newLightDesc, setNewLightDesc] = useState('');
  const [newLightColor, setNewLightColor] = useState('Flutlicht');
  const [isBlinking, setIsBlinking] = useState(false);
  const [blinkFrequency, setBlinkFrequency] = useState('');
  const [blinkOnDuration, setBlinkOnDuration] = useState('');
  const [rotateRight, setRotateRight] = useState(true);
  // 🧮 Hilfsfunktion: Lichtnummer berechnen
  const getLightNumber = (name: string, rotateRight: boolean): string => {
    const entry = pinMap[name];
    return entry ? (rotateRight ? entry.R : entry.L) : name;
  };

  const currentLightNumber = getLightNumber(newLightColor, rotateRight);

  // 🔊 Sound-Segmenteditor
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [selectedSoundFile, setSelectedSoundFile] = useState<string | null>(null);
  const [selectedSoundVolume, setSelectedSoundVolume] = useState<number>(100);
  const [selectedSoundDescription, setSelectedSoundDescription] = useState<string>('');
  const [startTimeSound, setStartTimeSound] = useState('');
  const [soundDuration, setSoundDuration] = useState<number>(0);

  // 🔊 Deklarierung ob Sounds im Systmepeicher sind
  const SOUNDS_STORAGE_KEY = 'built_in_sounds';

  // 🧊 3D-Segmenteditor
  const [selected3D, setSelected3D] = useState<string | null>(null);
  const [startTime3D, setStartTime3D] = useState('');
  const [endTime3D, setEndTime3D] = useState('');

  // 🧱 Segmente pro Effekt & Box
  const [lightSegmentsPerBox, setLightSegmentsPerBox] = useState<{ [boxId: number]: LayeredSegment[] }>({});
  const [soundSegmentsPerBox, setSoundSegmentsPerBox] = useState<{ [boxId: number]: LayeredSound[] }>({});
  const [threeDSegmentsPerBox, setThreeDSegmentsPerBox] = useState<{ [boxId: number]: ThreeDSegment[] }>({});

  // 🔠 Segmentfarben
  const segmentColors = ['#FFA500', '#4CAF50', '#2196F3', '#9C27B0', '#FF5722'];

  // 🧮 Segmentberechnung
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
  // Berechnung zur grße des Bildschirms
  const windowHeight = Dimensions.get('window').height;
  const windowWidth = Dimensions.get('window').width;
  // 🔧 Länge bearbeiten
  const [showLengthModal, setShowLengthModal] = useState(false);
  const [lengthTempValue, setLengthTempValue] = useState<string>('');
  const [lengthInitialValue, setLengthInitialValue] = useState<string>('');
  const lastLengthTapRef = useRef<number | null>(null);
  const DOUBLE_PRESS_DELAY = 1000;

  // 🔋 Bluetooth
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice>(null as unknown as BluetoothDevice);
  const [message, setMessage] = useState<string>('');
  const [password, setPassword] = useState('');

  // 🧩 Lücken zwischen Segmenten
  const [gapTimes, setGapTimes] = useState<{ [index: number]: string }>({});

  // 🖥️ Layout/UI
  const { width, height } = useWindowDimensions();
  const styles = createStyles(width, height);
  const screenWidth = Dimensions.get('window').width;
  const scrollViewRef = useRef<ScrollView>(null);

  // ⏳ Ladeanzeige
  const [ShowLoaderScreen, setShowLoaderScreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalParts, setTotalParts] = useState(1);

// useEffect: Aktualisiert die Timeline-Länge für das aktuell ausgewählte Box-Element
useEffect(() => {
  if (selectedBoxId !== null) {
    setTimelineLengthsPerBox(prev => {
      const current = prev[selectedBoxId] || 1; // aktuelle Länge oder 1 als Default
      const cappedEnd = Math.min(maxEnd, MAX_DURATION); // Begrenzung der max. Dauer
      if (cappedEnd > current) {
        // Nur aktualisieren, wenn neue Länge größer ist
        return { ...prev, [selectedBoxId]: cappedEnd };
      }
      return prev; // ansonsten unverändert zurückgeben
    });
  }
}, [maxEnd, selectedBoxId]);

// useEffect: Lädt gespeicherte Sounds aus AsyncStorage beim Komponenten-Mount
useEffect(() => {
  (async () => {
    try {
      const json = await AsyncStorage.getItem(SOUNDS_STORAGE_KEY);
      if (json) {
        const saved: BuiltInSound[] = JSON.parse(json);
        setBuiltInSounds(saved); // Sounds in State setzen
      }
    } catch (e) {
      console.warn('Fehler beim Laden der Sounds:', e); // Fehler-Logging
    }
  })();
}, []);

// Handler: Löscht ein ausgewähltes Segment aus den jeweiligen Segment-Listen
const handleDeleteSegment = () => {
  if (!selectedSegment) {return;}
  const { type, boxId, id } = selectedSegment;

  if (type === 'light') {
    setLightSegmentsPerBox(prev => ({
      ...prev,
      [boxId]: prev[boxId].filter(seg => seg.id !== id), // Segment aus Lichtliste löschen
    }));
  } else if (type === 'sound') {
    setSoundSegmentsPerBox(prev => ({
      ...prev,
      [boxId]: prev[boxId].filter(seg => seg.id !== id), // Segment aus Soundliste löschen
    }));
  } else if (type === 'three_d') {
    setThreeDSegmentsPerBox(prev => ({
      ...prev,
      [boxId]: prev[boxId].filter(seg => seg.id !== id), // Segment aus 3D-Liste löschen
    }));
  }

  setSelectedSegment(null); // Auswahl zurücksetzen
};

// Handler: Segment bearbeiten – setzt alle Werte des ausgewählten Segments in die Editierfelder
const handleEditSegment = () => {
  if (!selectedSegment) {return;}
  const { type, boxId, id } = selectedSegment;

  if (type === 'light') {
    const seg = lightSegmentsPerBox[boxId].find(s => s.id === id);
    if (!seg) {return;}

    // Alle Werte (Wenn Licht) werden ausgewertet und in die Editirfelder gesetzt
    setSelectedLight(seg.light);
    setStartTimeLight(String(seg.start));
    setEndTimeLight(String(seg.end));
    setEditingSegmentId(seg.id); // ID für Bearbeitung merken
    setEditingSegmentType('light');
    setSelectedSegment(null);
  } else if (type === 'sound') {
    const segs = soundSegmentsPerBox[boxId] || [];
    const seg = segs.find(s => s.id === id);
    if (!seg) {return;}

    // Alle Werte (Wenn Sound) werden ausgewertet und in die Editirfelder gesetzt
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

    // Alle Werte (Wenn 3D) werden ausgewertet und in die Editirfelder gesetzt
    setSelected3D(seg.model);
    setStartTime3D(String(seg.start));
    setEndTime3D(String(seg.end));

    setEditingSegmentId(seg.id);
    setEditingSegmentType('three_d');
    setSelectedSegment(null);
  }

  setSelectedSegment(null);
};

// Handler: Sequenzen aus AsyncStorage laden und Anzeige des Lade-Modals steuern
const handleSuchen = async () => {
  try {
    const json = await AsyncStorage.getItem(SAVE_KEY);
    const parsed: SequenceSave[] = json ? JSON.parse(json) : [];
    if (parsed.length === 0) {
      Alert.alert('Keine gespeicherten Sequenzen');
      return;
    }
    setSavedSequences(parsed); // Geladene Sequenzen speichern
    setShowLoadModal(true);    // Lade-Modal anzeigen
  } catch (e) {
    Alert.alert('Fehler beim Laden');
  }
};

// Handler: Save-Modal öffnen und Eingabefeld zurücksetzen
const handleSave = () => {
  setSaveName('');
  setShowSaveModal(true);
};

// Speichert die aktuelle Sequenz unter eingegebenem Namen in AsyncStorage
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
    // Vorhandene Sequenzen laden, neue hinzufügen und speichern
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

// Handler: Startet die Abspiel-Sequenz und sendet Daten an verbundenes Gerät via Bluetooth o.Ä.
const handleStart = async () => {
  // Definition des Sequenzelements
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
  let globalOffset = 0; // Zeitoffset für gestapelte Boxen

  const arrayOfFilePathsToSend: string[] = []; // Liste der zu sendenden Sounddateien

  for (let idx = 0; idx < boxData.length; idx++) {
    const box = boxData[idx];

    // Sortierte Lichtsegmente
    const lightSegs = (lightSegmentsPerBox[box.id] || []).sort((a, b) => a.start - b.start);
    lightSegs.forEach(seg => {
      const lightEffect = customLightEffects.find(e => e.name === seg.light);
      const pin = lightEffect?.pin;

      // Lichtsegment zur Sequenz hinzufügen
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

    // Sortierte Soundsegmente
    const soundSegs = (soundSegmentsPerBox[box.id] || []).sort((a, b) => a.start - b.start);
    for (const seg of soundSegs) {
      // Soundsegment zur Sequenz hinzufügen
      sequence.push({
        type: 'sound',
        name: seg.sound,
        start: globalOffset + seg.start,
        volume: seg.volume,
        selectedSoundFile: seg.file,
      });

      if (seg.file) {
        let filePath = seg.file;

        // Prüfen, ob Built-in Sound ist, ggf. temporär kopieren
        if (isBuiltInSound(filePath)) {
          filePath = await copyBuiltInSoundToTmp(filePath);
        }

        // Prüfen, ob Datei existiert, und zur Sendeliste hinzufügen
        const fileExists = await RNFS.exists(filePath);
        if (fileExists && !arrayOfFilePathsToSend.includes(filePath)) {
          arrayOfFilePathsToSend.push(filePath);
        } else if (!fileExists) {
          console.warn(`⚠️ Datei existiert nicht: ${filePath}`);
        }
      }
    }

    // Sortierte 3D-Segmente
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

    // Bestimmung Ende der aktuellen Box (max von Licht, Sound, 3D)
    const boxEnd = timelineLengthsPerBox[box.id] ?? Math.max(
      lightSegs.length ? Math.max(...lightSegs.map(s => s.end)) : 0,
      soundSegs.length ? Math.max(...soundSegs.map(s => s.end ?? 0)) : 0,
      d3Segs.length ? Math.max(...d3Segs.map(s => s.end)) : 0,
      0
    );

    globalOffset += boxEnd; // Offset für nächste Box anpassen

    // Lücke (gap) zwischen Boxen hinzufügen, falls nicht letzte Box
    if (idx < boxData.length - 1) {
      const gapSec = parseFloat(gapTimes[idx] || '') || 1;
      sequence.push({
        type: 'gap',
        name: `${idx}`,
        start: globalOffset,
        end: globalOffset + gapSec,
      });
      globalOffset += gapSec; // Offset anpassen
    }
  }

  // Umwandlung der Sequenz in die String-Darstellung für den Export
  const lines = sequence.map((item, i) => {
    const startStr = Math.round(item.start * 1000).toString().padStart(7, '0'); // Start in ms mit Padding
    const endStr = item.end !== undefined ? Math.round(item.end * 1000).toString().padStart(7, '0') : '';
    let displayName = item.name;

    // Für 3D-Spinn-Modelle Motor-Pins berücksichtigen
    if (item.type === 'three_d' && item.name === 'Spinn' && item.rotateRight !== undefined) {
      const motorPins = pinMap.Motor;
      displayName = item.rotateRight ? motorPins.R : motorPins.L;
    }

    // Für Sound-Segmente Dateiname anstatt Name anzeigen, falls vorhanden
    if (item.type === 'sound' && item.selectedSoundFile) {
      displayName = item.selectedSoundFile.split('/').pop() || item.name;
    }

    let line = `${item.type},${displayName},${startStr}`;
    if (endStr) {line += `,${endStr}`;}
    if (item.type === 'light' && item.blinking?.freq) {line += `,${item.blinking.freq}`;}
    if (item.type === 'sound' && item.volume !== undefined) {line += `,${item.volume}`;}

    return i < sequence.length - 1 ? `${line}?` : line; // Zeilen mit ? trennen außer letzte
  });

  const output = lines.join('\n'); // Gesamtstring

  try {
    // Daten an verbundenes Gerät senden
   await startHandler(
  connectedDevice,
  output,
  [''],
  setProgress,
  setTotalParts
);

  } catch (err) {
    Alert.alert('Fehler', String(err)); // Fehler beim Start anzeigen
  }
};
/**

 * Formatiert einen String so, dass nur Zahlen und ein Dezimalpunkt erlaubt sind,
 * und maximal zwei Nachkommastellen behalten werden.
 *
 * @param text - Eingabetext, der formatiert werden soll
 * @returns formatierter String mit maximal zwei Nachkommastellen
 */
const formatOneDecimal = (text: string): string => {
  // Entfernt alle Zeichen außer Ziffern und Punkt
  let cleaned = text.replace(/[^0-9.]/g, '');
  // Teilt den String an Punkten auf
  const parts = cleaned.split('.');
  if (parts.length > 1) {
    // Wenn ein Punkt vorhanden ist, nur die ersten zwei Nachkommastellen behalten
    cleaned = parts[0] + '.' + parts[1].slice(0, 2);
  }
  return cleaned;
};

/**
 * Findet den ersten freien Layer (0 bis MAX_LAYERS-1) für ein neues Segment,
 * das im Zeitraum [start, end) liegt, ohne sich mit bestehenden Segmenten auf diesem Layer zu überlappen.
 *
 * @param segments - Array aller existierenden Segmente mit Start, Ende und Layer
 * @param start - Startzeit des neuen Segments
 * @param end - Endzeit des neuen Segments
 * @returns Erster verfügbarer Layer als Zahl oder null wenn keiner frei ist
 */
const findAvailableLayer = (segments: { start: number; end: number; layer: number }[], start: number, end: number): number | null => {
  const MAX_LAYERS = 4;  // Maximal erlaubte Layeranzahl
  for (let layer = 0; layer < MAX_LAYERS; layer++) {
    // Prüfe, ob es Überschneidungen mit bestehenden Segmenten auf diesem Layer gibt
    const hasOverlap = segments.some(s =>
      s.layer === layer && !(end <= s.start || start >= s.end) // Überschneidung wenn Zeitbereiche sich schneiden
    );
    if (!hasOverlap) {
      // Layer frei, zurückgeben
      return layer;
    }
  }
  // Kein Layer frei
  return null;
};

// Bestätigt und fügt ein Lichtsegment hinzu
const handleConfirmLight = () => {
  // Wenn kein Effekt ausgewählt oder kein Segment selektiert ist, abbrechen
  if (selectedBoxId === null || !selectedLight) {return;}

  const rawStart = Number(startTimeLight);
  const rawEnd = Number(endTimeLight);

  // Validierung der Zeiten
  if (isNaN(rawStart) || isNaN(rawEnd) || rawStart >= rawEnd) {
    Alert.alert('Ungültig', 'Bitte gültige Start- und Endzeit eingeben.');
    return;
  }

  // Begrenze Zeiten auf erlaubten Bereich (Clamp)
  const start = clampTime(rawStart);
  const end = clampTime(rawEnd);

  // Segment hinzufügen
  addLightSegment({ light: selectedLight, start, end });

  // Eingabefelder zurücksetzen
  setSelectedLight(null);
  setStartTimeLight('');
  setEndTimeLight('');
};

// Bestätigt und fügt ein Soundsegment hinzu
const handleConfirmSound = () => {
  if (selectedBoxId === null || !selectedSound) { return; }

  console.log('Aktuelle Lautstärke für 3D:', selectedSoundVolume);

  // Startzeit aus Eingabe, Endzeit ergibt sich aus Dauer des Sounds
  const start = Number(startTimeSound);
  const end   = start + soundDuration;

  // Validierung von Zeit und Lautstärke (0-100%)
  if (isNaN(start) || start < 0 || start >= end || selectedSoundVolume < 0 || selectedSoundVolume > 100) {
    Alert.alert('Ungültige Eingabe', 'Bitte überprüfe Startzeit und Lautstärke (0–100%).');
    return;
  }

  // Wenn im Editiermodus, vorheriges Segment löschen
  if (editingSegmentType === 'sound' && editingSegmentId !== null) {
    handleDeleteSegment();
  }

  // Neues Soundsegment anlegen mit Angaben wie Lautstärke, Beschreibung, Datei
  addSoundSegment({
    sound: selectedSound,
    start,
    end,
    volume: selectedSoundVolume,
    description: selectedSoundDescription,
    file: selectedSoundFile || '',
  });

  // Eingaben zurücksetzen
  setStartTimeSound('');
  setSelectedSound(null);
  setSelectedSoundVolume(100);
  setSelectedSoundDescription('');
  // edit state wird in addSoundSegment zurückgesetzt
};

// Bestätigt und fügt ein 3D-Segment hinzu
const handleConfirm3D = () => {
  if (selectedBoxId !== null && selected3D) {
    const start = Number(startTime3D);
    const end = Number(endTime3D);

    // Validierung der Zeiten
    if (isNaN(start) || isNaN(end) || start >= end) {
      Alert.alert('Ungültige Zeitangabe', 'Bitte gib eine gültige Start- und Endzeit an.');
      return;
    }

    // Falls im Editiermodus, altes Segment löschen
    if (editingSegmentType === 'three_d' && editingSegmentId !== null) {
      handleDeleteSegment(); // Entfernt altes Segment
    }

    // Neues 3D-Segment hinzufügen
    add3DSegment({
      model: selected3D,
      start,
      end,
      // Drehung nur aktiv, wenn Modell 'Spinn' ist
      rotateRight: selected3D === 'Spinn' ? (rotateRight ?? false) : false,
    });

    // Eingabefelder zurücksetzen
    setStartTime3D('');
    setEndTime3D('');
    setSelected3D(null);
  }
};

// Fügt ein Lichtsegment der Timeline hinzu
const addLightSegment = (seg: { light: string; start: number; end: number }) => {
  if (selectedBoxId === null) {
    return; // Ohne selektiertes BoxId nicht möglich
  }

  // Existierende Lichtsegmente für aktuelle Box laden
  let segments = lightSegmentsPerBox[selectedBoxId] || [];

  // Debug: Zeige aktuell bearbeitetes Segment und IDs aller Segmente an
  console.log('Bearbeite:', editingSegmentId);
  console.log('Vorher:', segments.map(s => s.id));

  // Wenn im Editiermodus, entferne altes Segment mit editierbarer ID
  if (editingSegmentType === 'light' && editingSegmentId !== null) {
    segments = segments.filter(s => s.id !== editingSegmentId);
  }

  // Finde freien Layer ohne Überschneidungen
  const layer = findAvailableLayer(segments, seg.start, seg.end);
  if (layer === null) {
    Alert.alert('Kein Platz', 'Alle 4 Layer für Licht sind belegt.');
    return;
  }

  // Neues Segment mit generierter ID und Layer anlegen
  const newSeg: LayeredSegment = {
    id: Date.now() + Math.random(), // eindeutige ID
    ...seg,
    layer,
    rotateRight: false, // Licht hat keine Rotation, Feld aber reserviert
  };

  // Segment zur Liste hinzufügen und State aktualisieren
  setLightSegmentsPerBox(prev => ({
    ...prev,
    [selectedBoxId]: [...segments, newSeg],
  }));

  // Editierstatus zurücksetzen
  setEditingSegmentId(null);
  setEditingSegmentType(null);
};

// Fügt ein Soundsegment der Timeline hinzu
const addSoundSegment = (seg: {
  sound: string;
  description: string;
  start: number;
  end: number;
  volume: number;
  file: string;
}) => {
  if (selectedBoxId === null) {return;}

  // Existierende Soundsegmente laden
  let segments = soundSegmentsPerBox[selectedBoxId] || [];
  console.log('Bearbeite:', editingSegmentId);
  console.log('Vorher:', segments.map(s => s.id));

  // Im Editiermodus altes Segment entfernen
  if (editingSegmentType === 'sound' && editingSegmentId !== null) {
    segments = segments.filter(s => s.id !== editingSegmentId);
  }

  // Layer suchen, der frei ist
  const layer = findAvailableLayer(segments, seg.start, seg.end);
  if (layer === null) {
    Alert.alert('Kein Platz', 'Alle 4 Layer für Sound sind belegt.');
    return;
  }

  // Neues Soundsegment anlegen mit eindeutiger ID und Layer
  const newSeg: SoundSegment = {
    id: Date.now() + Math.random(),
    ...seg,
    layer,
  };

  // State updaten
  setSoundSegmentsPerBox(prev => ({
    ...prev,
    [selectedBoxId]: [...segments, newSeg],
  }));

  // Editierstatus zurücksetzen
  setEditingSegmentId(null);
  setEditingSegmentType(null);
};

// Fügt ein 3D-Segment der Timeline hinzu
const add3DSegment = (seg: {
  model: string;
  start: number;
  end: number;
  rotateRight?: boolean;
}) => {
  if (selectedBoxId === null) { return; }

  // Existierende 3D-Segmente laden
  let segments = threeDSegmentsPerBox[selectedBoxId] || [];
  console.log('Bearbeite:', editingSegmentId);
  console.log('Vorher:', segments.map(s => s.id));

  // Im Editiermodus altes Segment löschen
  if (editingSegmentType === 'three_d' && editingSegmentId !== null) {
    segments = segments.filter(s => s.id !== editingSegmentId);
  }

  // Freien Layer suchen
  const layer = findAvailableLayer(segments, seg.start, seg.end);
  if (layer === null) {
    Alert.alert('Kein Platz', 'Alle 4 Layer für 3D sind belegt.');
    return;
  }

  // Neues 3D-Segment mit ID, Layer und Rotation anlegen
  const newSeg: ThreeDSegment = {
    id: Date.now() + Math.random(),
    ...seg,
    layer,
    rotateRight: seg.rotateRight ?? false,
  };

  // State aktualisieren
  setThreeDSegmentsPerBox(prev => ({
    ...prev,
    [selectedBoxId]: [...segments, newSeg],
  }));

  // Editierstatus zurücksetzen
  setEditingSegmentId(null);
  setEditingSegmentType(null);
};

// Funktion zum Laden einer gespeicherten Sequenz (Licht/Sound/3D Effekte etc.) aus einem gespeicherten Objekt
const loadSequence = (seq: SequenceSave) => {
  // Daten aus der gespeicherten Sequenz extrahieren
  const { boxData, timelineLengthsPerBox, lightSegmentsPerBox, soundSegmentsPerBox, threeDSegmentsPerBox, gapTimes, customLightEffects } = seq.data;

  // Setze den Zustand der App mit den geladenen Daten
  setBoxData(boxData);
  setTimelineLengthsPerBox(timelineLengthsPerBox);
  setLightSegmentsPerBox(lightSegmentsPerBox);
  setSoundSegmentsPerBox(soundSegmentsPerBox);
  setThreeDSegmentsPerBox(threeDSegmentsPerBox);
  setGapTimes(gapTimes);
  setCustomLightEffects(customLightEffects);

  // Keine Box ist aktuell ausgewählt (Reset)
  setSelectedBoxId(null);

  // Lade-Modal schließen
  setShowLoadModal(false);

  // Benutzer informieren, dass die Sequenz erfolgreich geladen wurde
  Alert.alert('Geladen', `"${seq.name}" wurde geladen.`);
};

// Bestätigungs-Dialog zum Löschen einer gespeicherten Sequenz
const confirmDeleteSave = (nameToDelete: string) => {
  Alert.alert(
    'Löschen bestätigen', // Titel
    `Soll "${nameToDelete}" wirklich gelöscht werden?`, // Text
    [
      { text: 'Abbrechen', style: 'cancel' }, // Abbrechen-Button
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: async () => {
          try {
            // Lade alle gespeicherten Sequenzen aus AsyncStorage
            const existing = await AsyncStorage.getItem(SAVE_KEY);
            const parsed: SequenceSave[] = existing ? JSON.parse(existing) : [];

            // Filtere die Sequenz heraus, die gelöscht werden soll
            const filtered = parsed.filter(p => p.name !== nameToDelete);

            // Schreibe die gefilterte Liste zurück in den Speicher
            await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(filtered));

            // Aktualisiere den Zustand mit den verbleibenden Sequenzen
            setSavedSequences(filtered);

            // Erfolgsmeldung anzeigen
            Alert.alert('Gelöscht', `"${nameToDelete}" wurde entfernt.`);
          } catch (e) {
            // Fehler beim Löschen
            Alert.alert('Fehler beim Löschen');
          }
        },
      },
    ]
  );
};

// Zustand für benutzerdefinierte Lichteffekte, z.B. mit Namen, Beschreibung, Farbe, Blinkfrequenz und Pin-Nummer
const [customLightEffects, setCustomLightEffects] = useState<{
  name: string;
  desc: string;
  color: string;
  blinking?: { freq: string; on: string };
  pin?: number;
}[]>([]);

// Referenz für Zeitpunkte bei denen ein "Tap" zuletzt ausgeführt wurde (z.B. für Double-Tap-Erkennung)
const lastCustomTapRef = useRef<{ [key: string]: number }>({});

// Noch nicht implementierte Funktion zum Speichern von 3D-Effekten (Platzhalter)
function save3DEffekt(arg0: { type: string; start: number; end: number; }) {
  throw new Error('Function not implemented.');
}

// Zustand für die aktuell ausgewählte Haupt-Tab (Build oder Start)
const [selectedTab, setSelectedTab] = useState<'Build' | 'Start'>('Build');

// Animationswert für ein „Bounce“-Effekt (Wert wird zwischen 0 und -10 geändert)
const bounceAnim = useRef(new Animated.Value(0)).current;

// Funktion, die eine kurze Bounce-Animation startet
const handleBounce = () => {
  Animated.sequence([
    Animated.timing(bounceAnim, {
      toValue: -10,       // Verschiebe nach oben um 10 Einheiten
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.spring(bounceAnim, {
      toValue: 0,         // Springe zurück auf Startposition
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }),
  ]).start();
};

// Animationswert für vertikale Bildposition (für ein animiertes Bild, z.B. Intro-Screen)
const imageTranslateY = useRef(new Animated.Value(-height * 0.5)).current;

// Effekt: Bild-Animation auslösen bei Tab-Wechsel
useEffect(() => {
  Animated.timing(imageTranslateY, {
    toValue: selectedTab === 'Start' ? 0 : -height * 0.5, // Bild rein/raus animieren
    duration: 500,
    useNativeDriver: true,
  }).start();
}, [height, imageTranslateY, selectedTab]);

// Animationswerte für Textposition und Text-Opazität (für Fade-In/Slide-In des Textes)
const textTranslateY = useRef(new Animated.Value(-50)).current; // Startposition außerhalb oben
const textOpacity = useRef(new Animated.Value(0)).current;

// Effekt: Text-Einblendung bei Tab "Start"
useEffect(() => {
  if (selectedTab === 'Start') {
    Animated.parallel([
      Animated.timing(textTranslateY, {
        toValue: 0,      // Text nach unten auf Position 0 (sichtbar)
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,      // Text vollständig sichtbar machen
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  } else {
    Animated.parallel([
      Animated.timing(textTranslateY, {
        toValue: -50,    // Text nach oben aus dem Sichtbereich verschieben
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 0,      // Text unsichtbar machen
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }
}, [selectedTab, textOpacity, textTranslateY]);

// Zustand, ob Button/Aktivierung aktiviert ist
const [activated, setActivated] = useState(false);

// Animationswerte für Aktivierungsanimation und Ping-Effekt
const animation = useRef(new Animated.Value(0)).current;
const pingAnim = useRef(new Animated.Value(0)).current;

// Effekt: Ping-Animation, die dauerhaft läuft, solange nicht aktiviert
useEffect(() => {
  if (!activated) {
    // Loop der Ping-Animation starten (Skalierung und Transparenz)
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
    // Wenn aktiviert, Ping-Animation stoppen und Wert zurücksetzen
    pingAnim.stopAnimation();
    pingAnim.setValue(0);
  }
}, [activated, pingAnim]);

// Effekt: Aktivierungsanimation starten (z.B. Farbwechsel, Verschiebung)
useEffect(() => {
  Animated.timing(animation, {
    toValue: activated ? 1 : 0,
    duration: 800,
    useNativeDriver: false, // (keine native Treiber wegen Farbinterpolation)
  }).start();
}, [activated, animation]);

// Farbinterpolation für Textfarbe: von Schwarz zu Dunkelgrün
const textColor = animation.interpolate({
  inputRange: [0, 1],
  outputRange: ['rgb(0, 0, 0)', 'rgb(21, 92, 47)'],
});

// Verschiebung in X- und Y-Richtung (kleine Bewegung bei Aktivierung)
const translateX = animation.interpolate({
  inputRange: [0, 1],
  outputRange: [0, 4],
});
const translateY = animation.interpolate({
  inputRange: [0, 1],
  outputRange: [0, 4],
});

// Opazität für Schatten und Rahmen
const shadowOpacity = animation.interpolate({
  inputRange: [0, 1],
  outputRange: [0.6, 0.8],
});
const borderOpacity = animation.interpolate({
  inputRange: [0, 1],
  outputRange: [0.5, 1],
});

// Ping-Animation: Skalierung von 1 bis 1.5, Opazität von 0.7 auf 0 (verschwindet)
const pingScale = pingAnim.interpolate({
  inputRange: [0, 1],
  outputRange: [1, 1.5],
});
const pingOpacity = pingAnim.interpolate({
  inputRange: [0, 1],
  outputRange: [0.7, 0],
});

// Button-Handler für Aktivierung: Nur einmal aktivieren, kein Rücksetzen
const onPress = () => {
  if (!activated) {
    setActivated(true);
    startHandler; // Hinweis: Das ist vermutlich ein Aufruf (hier fehlt () - könnte Fehler sein)
  }
};


// Countdown-Funktion zum Starten eines Countdowns basierend auf der Länge der ersten Box
const handleCountdown = () => {
  // Immersive-Modus vorübergehend deaktivieren & Statusbar vollständig schwarz setzen
  ImmersiveMode.off();
  changeNavigationBarColor('black', false, false); // kein transparent mehr

  // ID der ersten Box ermitteln
  const boxId = boxData[0]?.id;

  // Länge der Timeline für diese Box (Sekunden)
  const lengthInSeconds = timelineLengthsPerBox[boxId] ?? 0;

  // Falls Länge nicht gültig (>0), Abbruch
  if (lengthInSeconds <= 0) {
    return;
  }

  // Restzeit setzen
  setRemainingTime(lengthInSeconds);

  // Ladebildschirm anzeigen
  setShowLoaderScreen(true);

  // Nachricht über Bluetooth senden
  sendMessage(connectedDevice, '5');

  // Intervall für Countdown starten
  intervalRef.current = setInterval(() => {
    setRemainingTime((prev) => {
      if (prev <= 1) {
        clearInterval(intervalRef.current!);
      }
      return prev - 1;
    });
  }, 1000);

  // Nach Ablauf Countdown schließen
  timeoutRef.current = setTimeout(() => {
    setShowLoaderScreen(false);
    clearInterval(intervalRef.current!);

    // Nach dem Countdown Immersive-Modus und transparente Leiste wieder aktivieren
    ImmersiveMode.on();
    changeNavigationBarColor('transparent', true, true);
  }, lengthInSeconds * 1000);
};


// Countdown abbrechen: Ladebildschirm ausblenden und Timer löschen
const handleCancelCountdown = () => {
  setShowLoaderScreen(false);
  clearTimeout(timeoutRef.current!);
  clearInterval(intervalRef.current!);

  // StatusBar wieder anzeigen
  StatusBar.setHidden(false);
  // falls du ImmersiveMode geändert hast:
  ImmersiveMode.on();
  changeNavigationBarColor('transparent', true, true);
};


// Effekt: Wenn Tab "Start" ausgewählt wird, diverse Edit-Modi ausschalten
useEffect(() => {
  if (selectedTab === 'Start') {
    setEditMode(false);
    setEditLichtEffekte(false);
    setEditSoundEffekte(false);
    setEdit3DEffekte(false);
    sendMessage(connectedDevice,'5');
  }
}, [selectedTab]);

// Funktion um das Halten (Press & Hold) zu stoppen, z.B. beim Loslassen
const stopHolding = () => {
  if (intervalRef.current) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }
};

// useEffect reagiert auf Änderungen bei scrollX, containerWidth, playheadOffsetRatio oder selectedBoxId
useEffect(() => {
  // Wenn keine Box ausgewählt ist oder die Containerbreite 0 ist, abbrechen
  if (selectedBoxId === null || containerWidth === 0) { return; }

  // Gesamtlänge der aktuellen Box in Sekunden holen
  const totalLengthSec = timelineLengthsPerBox[selectedBoxId];
  // Wenn keine gültige Länge vorliegt oder <= 0, abbrechen
  if (!totalLengthSec || totalLengthSec <= 0) { return; }

  // Berechne effektive Pixel pro Sekunde (PPS)
  // Falls die Gesamtlänge größer als FIXED_WINDOW_SEC ist, feste PPS benutzen,
  // sonst dynamisch anhand der Containerbreite und der Länge skalieren
  const effectivePPS = totalLengthSec > FIXED_WINDOW_SEC
    ? PIXELS_PER_SECOND
    : containerWidth / totalLengthSec;

  // Prüfen, ob der Wert valide ist (nicht unendlich oder 0)
  if (!isFinite(effectivePPS) || effectivePPS === 0) { return; }

  // Berechne den Startzeitpunkt (in Sekunden) des aktuell sichtbaren Fensterbereichs
  const windowStartSec = scrollX / effectivePPS;

  // Berechne die Pixelposition des Playheads relativ zum Container
  const playheadPixelX = playheadOffsetRatio * containerWidth;

  // Berechne die Zeit am Playhead innerhalb des Gesamtfensters
  const timeAtPlayhead = windowStartSec + playheadPixelX / effectivePPS;

  // Prüfen, ob der berechnete Zeitpunkt gültig ist
  if (!isFinite(timeAtPlayhead)) { return; }

  // Clamp den Wert, um sicherzustellen, dass er zwischen 0 und der Gesamtlänge liegt
  const clampedTime = Math.max(0, Math.min(timeAtPlayhead, totalLengthSec));

  // Aktueller Zeitstempel (ms) für Throttling
  const now = Date.now();

  // Update nur, wenn genug Zeit vergangen ist (THROTTLE_INTERVAL_MS)
  // UND sich der Zeitwert mehr als 10ms (0.01s) geändert hat
  if (now - lastUpdateTimeRef.current > THROTTLE_INTERVAL_MS &&
      Math.abs(clampedTime - lastSetCurrentTimeRef.current) > 0.01) {

    // Werte für das nächste Throttling speichern
    lastSetCurrentTimeRef.current = clampedTime;
    lastUpdateTimeRef.current = now;

    // Aktualisiere den aktuellen Zeitwert im State (z.B. für Playhead-Anzeige)
    setCurrentTime(clampedTime);
  }
}, [scrollX, containerWidth, playheadOffsetRatio, selectedBoxId]);

// Event-Handler für Layout-Änderungen des Containers

// Funktion zum Starten des kontinuierlichen Verschiebens des Playheads
// Richtung kann 'left' oder 'right' sein
const startHolding = (direction: 'left' | 'right') => {
  // Falls vorheriges Halten noch läuft, abbrechen
  stopHolding();

  // Starte ein Intervall, das alle 10ms den Playhead leicht verschiebt
  intervalRef.current = setInterval(() => {
    setPlayheadOffsetRatio(prev => {
      const delta = 0.0015; // Schrittgröße der Verschiebung

      // Berechne neuen Wert, dabei Grenzen 0..1 beachten
      const next = direction === 'left'
        ? Math.max(0, prev - delta)
        : Math.min(1, prev + delta);

      return next;
    });
  }, 10);
};

// useEffect, der beim ersten Rendern ausgeführt wird,
// um Assets im APK-Verzeichnis zu lesen und zu loggen
useEffect(() => {
  (async () => {
    try {
      // Liest die Liste der Assets im APK (nur Android)
      const assets = await RNFS.readDirAssets('');
      console.log('📦 Assets im APK:', assets.map(f => f.name));
    } catch (e) {
      console.error('❌ Fehler beim Lesen von Assets:', e);
    }
  })();
}, []);



// ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ //
// Ui //
return (
  // Hauptcontainer, der sichere Bereich des Bildschirms beachtet (z.B. Notch)
  <SafeAreaView style={styles.container}>
              <StatusBar backgroundColor="black" barStyle="light-content" translucent={false} />

    {/* Hintergrundbild mit Animation: Verschiebung nach oben/unten via translateY */}
    <Animated.Image
      source={require('./assets/Hintergrund.png')}
      style={[
        styles.topImage,
        { transform: [{ translateY: imageTranslateY }] },
      ]}
      resizeMode="cover"
    />

    {/* Wenn nicht im Bearbeitungsmodus, zeige den Tab-Switcher */}
    {!editMode && (
      <StatsSwitcher
        selectedTab={selectedTab}      // Aktiver Tab (Build oder Upload)
        onTabChange={setSelectedTab}   // Handler zum Wechseln des Tabs
      />
    )}

    {/* Wenn der ausgewählte Tab 'Build' ist */}
    {selectedTab === 'Build' ? (
      <>
        {/* Container, der bei Berührung das "Bounce"-Effekt-Handling auslöst */}
        <TouchableWithoutFeedback onPress={handleBounce}>
          <Animated.View
            style={[
              styles.EffektContainer,
              { transform: [{ translateY: bounceAnim }] }, // Bounce-Animation
            ]}
          >
            {/* Horizontale Anordnung der Boxen */}
            <View style={{ flexDirection: 'row', alignSelf: 'center', height: '100%' }}>

              {/* Wenn Box-Daten vorhanden sind, zeige die erste Box an */}
              {boxData.length > 0 && (
                <Pressable
                  style={[
                    styles.box,
                    selectedBoxId === boxData[0].id && styles.selectedBox, // Hervorheben, falls ausgewählt
                  ]}
                  onPress={() => {
                    handleBounce();                // Bounce Animation starten
                    setSelectedBoxId(boxData[0].id); // Box als ausgewählt setzen
                    const currentName = boxData[0].name || '';
                    setEditMode(true);             // Bearbeitungsmodus aktivieren
                    setEditLichtEffekte(false);   // Licht-Effekte Edit-Modus ausschalten
                    setEditSoundEffekte(false);   // Sound-Effekte Edit-Modus ausschalten
                    setEdit3DEffekte(false);      // 3D-Effekte Edit-Modus ausschalten
                  }}
                  onPressIn={() => handleBlockDoubleTap(boxData[0].id)} // Event für Doppeltap
                >
                  {/* Hintergrundbild der Box */}
                  <Image
                    source={require('./assets/EffektBackground.png')}
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      borderRadius: 10,
                    }}
                    resizeMode="cover"
                  />

                  {/* Text mit Länge des Effekts in Sekunden */}
                  <Text
                    style={{
                      marginTop: 200,
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

        {/* Bereich für Passwort-Eingabe und Verbindung zum Pi */}
        <View style={{ marginTop: '85%' }}>
          <TextInput
            style={styles.input}
            secureTextEntry                // Passwort-Eingabe (versteckt)
            value={password}              // Gebundener Wert
            placeholder="Gib das Passwort ein"
            onChangeText={setPassword}    // Aktualisierung des Passwort-States
            placeholderTextColor="#0a0a0a"
          />

          {/* Button zum Verbinden mit dem Pi */}
          <TouchableOpacity
            style={styles.button2}
            onPress={() => connectToPi(setConnectedDevice, password, setMessage)}
          >
            <Text style={{ alignSelf: 'center', color: 'black', fontSize: 15 }}>
              Verbinden
            </Text>
          </TouchableOpacity>

          {/* Anzeige des Verbindungsstatus */}
          <Text style={styles.status}>
            {connectedDevice ? `verbunden mit ${connectedDevice.name}` : 'nicht verbunden'}
          </Text>

          {/* Anzeige einer Fehlermeldung beim Verbinden */}
          <Text style={styles.message}>{message}</Text>

          {/* Button zum Herunterfahren */}
          <TouchableOpacity
            style={styles.buttonNo}
            onPress={() => sendMessage(connectedDevice, '6')}
          >
            <Text style={styles.buttonText}>
              Herunterfahren
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bereich mit Buttons "Load" und "Save" */}
        <View style={styles.Buttons}>
          <TouchableOpacity onPress={handleSuchen} style={{ /* optional */ }}>
            <Image
              source={require('./assets/Downlode.png')}
              style={{ width: 35, height: 35 }}
            />
            <Text style={styles.buttonText}>Load</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSave} style={{ /* optional */ }}>
            <Image
              source={require('./assets/Save.png')}
              style={{ width: 35, height: 35 }}
            />
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </>
    ) : (
      // Wenn der ausgewählte Tab 'Upload' ist
      <>
        <View style={styles.container}>
          {/* Zwei animierte Texte mit gleichem Stil und Animation */}
          <Animated.Text
            style={[
              styles.HintergrundText,
              {
                transform: [{ translateY: textTranslateY }],
                opacity: textOpacity,
              },
            ]}
          >
            Los
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
            gehts
          </Animated.Text>
        </View>

        {/* Upload Button mit animierten Ping-Effekten */}
        <View style={{ alignSelf: 'center', position: 'absolute', top: '40%' }}>
          <Pressable
            onPress={() => {
              if (!activated) {
                setActivated(true);    // Button aktivieren
                handleStart();         // Upload starten
              }
            }}
            style={{
              position: 'relative',
              alignSelf: 'flex-start',
              marginBottom: 370,
              zIndex: 1,
            }}
          >
            {/* Gepunkteter Rahmen, animierte Opazität */}
            <Animated.View
              pointerEvents="none"
              style={[styles.dashedBorder, { opacity: borderOpacity }]}
            />

            {/* Button mit Verschiebungs-Animationen und Schatten */}
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
               Effekte hochladen
              </Animated.Text>
            </Animated.View>

            {/* Solange nicht aktiviert, zeigen animierte Ping-Kreise an */}
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
            <ProgressBar progress={progress} total={totalParts} />
            <View style={styles.buttonStartOuter}>
            <TouchableOpacity
              style={[
                styles.buttonStartInner,
                !activated && styles.buttonStartInnerDisabled,  // zusätzliches Disabled‑Style
              ]}
              onPress={() => {
                handleCountdown();
                setActivated(false);
              }}
              disabled={!activated}                            // hier wird’s wirklich blockiert
              >
              <Image
                source={require('./assets/Start.png')}
                style={{
                  width: 95,
                  height: 95,
                  alignSelf: 'center',
                  opacity: activated ? 1 : 0.5,               // einfache Inline‑Variante
                }}
              />
            </TouchableOpacity>
          </View>
        </View>
       {ShowLoaderScreen && (
  <Modal
  visible={ShowLoaderScreen}
  transparent={false}
  animationType="fade"
  statusBarTranslucent={true}
  onRequestClose={handleCancelCountdown}
>
  {/* StatusBar ausblenden */}
  <StatusBar hidden={true} />

  <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 28, color: '#fff', marginBottom: 20 }}>
      Noch {remainingTime} Sekunden
    </Text>
    <TouchableOpacity onPress={handleCancelCountdown}>
      <Text style={{ backgroundColor: 'red',color: '#fff', fontSize: 24 }}>Abbrechen</Text>
    </TouchableOpacity>
  </View>
</Modal>

)}
      </>
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
                      onChangeText={setSaveName}
                      placeholderTextColor={'#0a0a0a'}/>
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

           {/* Bearbeitungs-Menü wird nur angezeigt, wenn ein Effekt ausgewählt ist */}
          {editMode && selectedBoxId !== null && (
            <View style={styles.editMenu}>

              {/* Obere Icon-Leiste zum Umschalten zwischen Effektkategorien */}
              <View style={styles.editMenuTop}>
                {/* Licht-Effekte aktivieren */}
                <TouchableOpacity onPress={() => {
                  setEditLichtEffekte(true);
                  setEditSoundEffekte(false);
                  setEdit3DEffekte(false);
                }}>
                  <Text style={styles.iconLabel}>Light</Text>
                </TouchableOpacity>

                {/* 3D-Effekte aktivieren */}
                <TouchableOpacity onPress={() => {
                  setEdit3DEffekte(true);
                  setEditLichtEffekte(false);
                  setEditSoundEffekte(false);
                }}>
                  <Text style={styles.iconLabel}>3D</Text>
                </TouchableOpacity>

                {/* Sound-Effekte aktivieren */}
                <TouchableOpacity onPress={() => {
                  setEditSoundEffekte(true);
                  setEditLichtEffekte(false);
                  setEdit3DEffekte(false);
                }}>
                  <Text style={styles.iconLabel}>Sound</Text>
                </TouchableOpacity>

                {/* Editiermodus beenden */}
                <TouchableOpacity onPress={() => {
                  setEditMode(false);
                  setSelectedBoxId(null);
                  setEdit3DEffekte(false);
                  setEditLichtEffekte(false);
                  setEditSoundEffekte(false);
                }}>
                  <Text style={styles.iconLabel}>Exit</Text>
                </TouchableOpacity>
              </View>

              {/* Button zur Einstellung der Gesamtlänge des Segments */}
              <View style={styles.editMenuTop}>
                <TouchableOpacity onPress={() => setShowLengthModal(true)}>
                  <Text style={styles.iconLabel}>Einstellung der Länge</Text>
                </TouchableOpacity>
              </View>

              {/* Berechnung für Timeline-Rendering */}
              {(() => {
                const totalLength = timelineLengthsPerBox[selectedBoxId!] || 1;
                const isShort = totalLength <= 15;

                // Dynamische Pixel-Breite pro Sekunde, abhängig von der Länge
                const effectivePixelsPerSecond = isShort
                  ? containerWidth > 0
                    ? containerWidth / totalLength
                    : screenWidth / totalLength
                  : PIXELS_PER_SECOND;

                // Aktuelle Zeit basierend auf Scrollposition und Playhead
                const currentTime = Math.max(
                  0,
                  (scrollX + containerWidth / 2) / effectivePixelsPerSecond
                );

                // Gesamte Breite der Timeline in Pixeln
                const contentWidth = totalLength * effectivePixelsPerSecond;

                return (
                  <>
                    {/* Zeitstempel über der Playhead-Linie */}
                    <Text
                      style={{
                        position: 'absolute',
                        top: '11%',
                        left: containerWidth * playheadOffsetRatio - 20,
                        color: '#fff',
                        fontSize: 12,
                        zIndex: 20,
                      }}
                    >
                      {minutes}:{seconds}:{millis}
                    </Text>

                    {/* Haupt-Timeline-Container mit ScrollView */}
                    <View
                      style={styles.timelineContainer}
                      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
                    >
                      {/* Vertikale Playhead-Linie */}
                      <View
                        style={[
                          styles.playheadLine,
                          {
                            left: containerWidth * playheadOffsetRatio, // Playhead positioniert basierend auf Ratio
                          },
                        ]}
                      />

                      {/* Horizontales Scroll-Element mit allen Effekten */}
                      <ScrollView
                        horizontal
                        ref={scrollViewRef}
                        scrollEventThrottle={16}
                        onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
                        showsHorizontalScrollIndicator
                        contentContainerStyle={{ paddingVertical: 10 }}
                      >
                        <View style={{ flexDirection: 'column', width: contentWidth }}>

                          {/* 💡 Licht-Effekte mit 4 Layern */}
                          <Text style={styles.groupLabel}>💡 Lichteffekte</Text>
                          {[0, 1, 2, 3].map((layer) => (
                            <View key={`L${layer}`} style={[styles.timelineRow, { position: 'relative' }]}>
                              {sortedLight
                                .filter((s) => s.layer === layer)
                                .sort((a, b) => a.start - b.start)
                                .map((seg, i) => {
                                  const start = seg.start;
                                  const dur = seg.end - seg.start;
                                  const left = (start / totalLength) * contentWidth;
                                  const rawWidth = (dur / totalLength) * contentWidth;
                                  const visualWidth = Math.max(rawWidth, 2); // Minimumbreite zur Sichtbarkeit

                                  return (
                                    <TouchableOpacity
                                      key={seg.id}
                                      style={[
                                        styles.timelineBlock,
                                        {
                                          position: 'absolute',
                                          left,
                                          width: visualWidth,
                                          backgroundColor: segmentColors[i % segmentColors.length],
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
                                  );
                                })}
                            </View>
                          ))}

                          {/* 🔊 Soundeffekte mit 4 Layern */}
                          <Text style={styles.groupLabel}>🔊 Soundeffekte</Text>
                          {[0, 1, 2, 3].map((layer) => (
                            <View key={`S${layer}`} style={styles.timelineRow}>
                              {(() => {
                                return sortedSound
                                  .filter((s) => s.layer === layer)
                                  .sort((a, b) => a.start - b.start)
                                  .map((seg, i) => {
                                    const start = seg.start;
                                    const dur = seg.end - seg.start;
                                    const left = (start / totalLength) * contentWidth;
                                    const rawWidth = (dur / totalLength) * contentWidth;
                                    const visualWidth = Math.max(rawWidth, 2);

                                    return (
                                      <TouchableOpacity
                                        key={seg.id}
                                        style={[
                                          styles.timelineBlock,
                                          {
                                            position: 'absolute',
                                            left,
                                            width: visualWidth,
                                            backgroundColor: segmentColors[i % segmentColors.length],
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
                                    );
                                  });
                              })()}
                            </View>
                          ))}

                          {/* 🌀 3D-Effekte mit 4 Layern */}
                          <Text style={styles.groupLabel}>🌀 3D-Effekte</Text>
                          {[0, 1, 2, 3].map((layer) => (
                            <View key={`D${layer}`} style={styles.timelineRow}>
                              {(() => {
                                return sorted3D
                                  .filter((s) => s.layer === layer)
                                  .sort((a, b) => a.start - b.start)
                                  .map((seg, i) => {
                                    const start = seg.start;
                                    const dur = seg.end - seg.start;
                                    const left = (start / totalLength) * contentWidth;
                                    const rawWidth = (dur / totalLength) * contentWidth;
                                    const visualWidth = Math.max(rawWidth, 2);

                                    return (
                                      <TouchableOpacity
                                        style={[
                                          styles.timelineBlock,
                                          {
                                            position: 'absolute',
                                            left,
                                            width: visualWidth,
                                            backgroundColor: segmentColors[i % segmentColors.length],
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
                                    );
                                  });
                              })()}
                            </View>
                          ))}
                        </View>
                      </ScrollView>

                      {/* Steuerung zum Verschieben des Playhead-Offets */}
                      <View style={styles.offsetControls}>
                        <Pressable
                          onPressIn={() => startHolding('left')}
                          onPressOut={stopHolding}
                          style={styles.offsetButton}
                        >
                          <Text style={styles.offsetButtonText}>«</Text>
                        </Pressable>
                        <Pressable
                          onPressIn={() => startHolding('right')}
                          onPressOut={stopHolding}
                          style={styles.offsetButton}
                        >
                          <Text style={styles.offsetButtonText}>»</Text>
                        </Pressable>
                      </View>
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
                {/* 1 ScrollView für alle Effekte */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 10, alignItems: 'center' }}
                >
                   <TouchableOpacity onPress={() => { setEditLichtEffekte(false); } } style={{ alignSelf: 'center' }}>
                    <Image
                      source={require('./assets/Exit.png')}
                      style={{ width: 35, height: 35, top: -2, marginLeft: 17, marginRight: 25, backgroundColor: 'rgb(32, 31, 31)', borderRadius: 5}} />
                  </TouchableOpacity>

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
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity onPress={() => { setEditSoundEffekte(false); } } style={{ alignSelf: 'center' }}>
                  <Image
                    source={require('./assets/Exit.png')}
                    style={{width: 35, height: 35, top: -2, marginLeft: 17, marginRight: 25, backgroundColor: 'rgb(32, 31, 31)', borderRadius: 5}} />
                </TouchableOpacity>
                  {builtInSounds.map(s => (
                    <TouchableOpacity
                      key={s.name}
                      style={styles.editButton}
                      onPress={() => loadBuiltInSound(s.name, s.file, s.description)} // 👈 file wird übergeben
                    >
                      <Text style={styles.buttonText}>{s.name}</Text>
                    </TouchableOpacity>
                  ))}
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
                      style={{ width: 35, height: 35, top: 0, backgroundColor: 'rgb(32, 31, 31)', borderRadius: 5}} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.editButton} onPress={() => setSelected3D('Nebel')}>
                    <Text style={styles.buttonText}>Nebel</Text>
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

                <Text style={styles.blockText}>Startzeit (Sekunden)</Text>
                <TextInput
                  placeholderTextColor="#0a0a0a"
                  style={styles.input}
                  keyboardType="numeric"
                  value={startTime3D}
                  onChangeText={text => setStartTime3D(formatOneDecimal(text))}
                  placeholder="Startzeit" />

                <Text style={styles.blockText}>Endzeit (Sekunden)</Text>
                <TextInput
                  placeholderTextColor="#0a0a0a"
                  style={styles.input}
                  keyboardType="numeric"
                  value={endTime3D}
                  onChangeText={text => setEndTime3D(formatOneDecimal(text))}
                  placeholder="Endzeitpunkt" />

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

                    <Text style={{ marginTop: 10, color:'rgb(239, 239, 239)'}}>Lichter:</Text>
                    <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginTop: 5, backgroundColor: 'rgb(239, 239, 239)' }}>
                      <Picker
                        selectedValue={newLightColor}
                        onValueChange={(itemValue) => setNewLightColor(itemValue)}
                        dropdownIconColor= "rgb(0, 0, 0)"
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
                      <Text style={{ flex: 1, color: 'rgb(255, 255, 255)'}}>Blinken aktivieren</Text>
                      <TouchableOpacity
                        style={[styles.button3, { backgroundColor: isBlinking ? '#3E7B27' : '#ccc' }]}
                        onPress={() => setIsBlinking(!isBlinking)}
                      >
                        <Text style={styles.buttonTextBlack}>{isBlinking ? 'Ja' : 'Nein'}</Text>
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
          </SafeAreaView>
 );}

