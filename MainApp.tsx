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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  pick,
  types,
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
} from '@react-native-documents/picker';

export default function App() {
  const [boxData, setBoxData] = useState([{ id: 1, text: 'Effekt 1' }]);
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

  // Timeline lengths per box
  const [timelineLengthsPerBox, setTimelineLengthsPerBox] = useState<{ [boxId: number]: number }>({});

  // Segments per effect type per box
  const [lightSegmentsPerBox, setLightSegmentsPerBox] = useState<{ [boxId: number]: { light: string; start: number; end: number }[] }>({});
  const [soundSegmentsPerBox, setSoundSegmentsPerBox] = useState<{ [boxId: number]: { sound: string; start: number; end: number }[] }>({});
  const [threeDSegmentsPerBox, setThreeDSegmentsPerBox] = useState<{ [boxId: number]: { model: string; start: number; end: number }[] }>({});

  // Overlap handling
  const [pendingSegmentLight, setPendingSegmentLight] = useState<{ light: string; start: number; end: number } | null>(null);
  const [overlapModalLight, setOverlapModalLight] = useState(false);

  const [pendingSegmentSound, setPendingSegmentSound] = useState<{ sound: string; start: number; end: number } | null>(null);
  const [overlapModalSound, setOverlapModalSound] = useState(false);

  const [pendingSegment3D, setPendingSegment3D] = useState<{ model: string; start: number; end: number } | null>(null);
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
        if (maxEnd > current) {
          return { ...prev, [selectedBoxId]: maxEnd };
        }
        return prev;
      });
    }
  }, [maxEnd, selectedBoxId]);

  const segmentColors = ['#FFA500', '#4CAF50', '#2196F3', '#9C27B0', '#FF5722'];

  // Handlers
  const handleExit = () => console.log('Exit Button gedrückt');
  const handleSuchen = () => console.log('Suchen gedrückt');
  const handleSave = () => console.log('Save gedrückt');
  const handleStart = () => {
    const data = {
      timelineLengthsPerBox,
      lightSegmentsPerBox,
      soundSegmentsPerBox,
      threeDSegmentsPerBox,
    };
    const outputString = JSON.stringify(data, null, 2);
    console.log('Timeline-Daten:', outputString);
    // Wenn gewünscht, kann man hier auch eine Alert o.Ä. anzeigen:
    // Alert.alert('Timeline-Daten', outputString);
    Alert.alert('Timeline-Daten',  outputString);
  };
  const addNewBox = () => {
    const newBoxId = boxData.length + 1;
    setBoxData([...boxData, { id: newBoxId, text: `Effekt ${newBoxId}` }]);
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

  // Generic add segment
  const addLightSegment = (seg: { light: string; start: number; end: number }) => {
    if (selectedBoxId === null) {return;}
    setLightSegmentsPerBox(prev => ({ ...prev, [selectedBoxId]: [...(prev[selectedBoxId] || []), seg] }));
  };
  const addSoundSegment = (seg: { sound: string; start: number; end: number }) => {
    if (selectedBoxId === null) {return;}
    setSoundSegmentsPerBox(prev => ({ ...prev, [selectedBoxId]: [...(prev[selectedBoxId] || []), seg] }));
  };
  const add3DSegment = (seg: { model: string; start: number; end: number }) => {
    if (selectedBoxId === null) {return;}
    setThreeDSegmentsPerBox(prev => ({ ...prev, [selectedBoxId]: [...(prev[selectedBoxId] || []), seg] }));
  };

  // Confirm functions
  const handleConfirmLight = () => {
    if (selectedBoxId !== null && selectedLight) {
      const start = Number(startTimeLight);
      const end = Number(endTimeLight);
      if (!isNaN(start) && !isNaN(end) && start < end) {
        const segs = lightSegmentsPerBox[selectedBoxId] || [];
        const overlap = segs.some(s => !(end <= s.start || start >= s.end));
        if (overlap) {
          setPendingSegmentLight({ light: selectedLight, start, end });
          setOverlapModalLight(true);
        } else {
          addLightSegment({ light: selectedLight, start, end });
        }
        setStartTimeLight('');
        setEndTimeLight('');
        setSelectedLight(null);
      }
    }
  };
  const handleConfirmSound = () => {
    if (selectedBoxId !== null && selectedSound) {
      const start = Number(startTimeSound);
      const end = Number(endTimeSound);
      if (!isNaN(start) && !isNaN(end) && start < end) {
        const segs = soundSegmentsPerBox[selectedBoxId] || [];
        const overlap = segs.some(s => !(end <= s.start || start >= s.end));
        if (overlap) {
          setPendingSegmentSound({ sound: selectedSound, start, end });
          setOverlapModalSound(true);
        } else {
          addSoundSegment({ sound: selectedSound, start, end });
        }
        setStartTimeSound('');
        setEndTimeSound('');
        setSelectedSound(null);
      }
    }
  };
  const handleConfirm3D = () => {
    if (selectedBoxId !== null && selected3D) {
      const start = Number(startTime3D);
      const end = Number(endTime3D);
      if (!isNaN(start) && !isNaN(end) && start < end) {
        const segs = threeDSegmentsPerBox[selectedBoxId] || [];
        const overlap = segs.some(s => !(end <= s.start || start >= s.end));
        if (overlap) {
          setPendingSegment3D({ model: selected3D, start, end });
          setOverlapModal3D(true);
        } else {
          add3DSegment({ model: selected3D, start, end });
        }
        setStartTime3D('');
        setEndTime3D('');
        setSelected3D(null);
      }
    }
  };

  // Accept overlaps
  const handleAcceptLightOverlap = () => {
    if (selectedBoxId !== null && pendingSegmentLight) {
      const updated = (lightSegmentsPerBox[selectedBoxId] || []).map(s => {
        if (!(pendingSegmentLight.end <= s.start || pendingSegmentLight.start >= s.end)) {
          if (s.start < pendingSegmentLight.start && s.end > pendingSegmentLight.start) {
            return { ...s, end: pendingSegmentLight.start };
          }
        }
        return s;
      });
      setLightSegmentsPerBox(prev => ({ ...prev, [selectedBoxId]: [...updated, pendingSegmentLight] }));
      setPendingSegmentLight(null);
      setOverlapModalLight(false);
    }
  };
  const handleAcceptSoundOverlap = () => {
    if (selectedBoxId !== null && pendingSegmentSound) {
      const updated = (soundSegmentsPerBox[selectedBoxId] || []).map(s => {
        if (!(pendingSegmentSound.end <= s.start || pendingSegmentSound.start >= s.end)) {
          if (s.start < pendingSegmentSound.start && s.end > pendingSegmentSound.start) {
            return { ...s, end: pendingSegmentSound.start };
          }
        }
        return s;
      });
      setSoundSegmentsPerBox(prev => ({ ...prev, [selectedBoxId]: [...updated, pendingSegmentSound] }));
      setPendingSegmentSound(null);
      setOverlapModalSound(false);
    }
  };
  const handleAccept3DOverlap = () => {
    if (selectedBoxId !== null && pendingSegment3D) {
      const updated = (threeDSegmentsPerBox[selectedBoxId] || []).map(s => {
        if (!(pendingSegment3D.end <= s.start || pendingSegment3D.start >= s.end)) {
          if (s.start < pendingSegment3D.start && s.end > pendingSegment3D.start) {
            return { ...s, end: pendingSegment3D.start };
          }
        }
        return s;
      });
      setThreeDSegmentsPerBox(prev => ({ ...prev, [selectedBoxId]: [...updated, pendingSegment3D] }));
      setPendingSegment3D(null);
      setOverlapModal3D(false);
    }
  };
  const importFile = async () => {
    try {
      // 1️⃣ Datei auswählen
      const [picked] = await pick({
        type: [types.allFiles],
        multiple: false,
      });

      // 2️⃣ Lokale Kopie anlegen
      const [localRes] = await keepLocalCopy({
        files: [{ uri: picked.uri, fileName: picked.name ?? 'unknown' }],
        destination: 'documentDirectory',
      });

      // 3️⃣ Status-basiertes Handling
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
      // 4️⃣ Abbruch/Fehler behandeln
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
        console.log('Auswahl abgebrochen');
      } else {
        console.error('Fehler beim Import:', err);
        Alert.alert('Fehler', (err as Error).message ?? 'Unbekannter Fehler');
      }
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.button} onPress={handleExit}>
          <Text style={styles.buttonText}>Exit</Text>
        </TouchableOpacity>
        <Text style={styles.contentTitle}>Effekt Abfolge</Text>
        <TouchableOpacity style={styles.button} onPress={handleStart}>
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
      </View>

      {/* ScrollContainer */}
      <View style={styles.scrollContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {boxData.map((box, index) => (
            <React.Fragment key={box.id}>
              <TouchableOpacity
                style={[styles.box, selectedBoxId === box.id && styles.selectedBox]}
                onPress={() => {
                  setSelectedBoxId(box.id);
                  setEditMode(false);
                  setEditLichtEffekte(false);
                  setEditSoundEffekte(false);
                  setEdit3DEffekte(false);
                }}
              >
                <Text>{box.text}</Text>
                <Text style={{ fontSize: 12, color: '#555' }}>
                  Länge: {timelineLengthsPerBox[box.id] ?? 0}s
                </Text>
              </TouchableOpacity>
              {index < boxData.length - 1 && <View style={styles.smallBox} />}
            </React.Fragment>
          ))}
          <TouchableOpacity style={styles.plusButton} onPress={addNewBox}>
            <Text style={styles.plusText}>+</Text>
          </TouchableOpacity>
        </ScrollView>
        <View style={styles.scrollBarContainer}>
          <View style={[styles.scrollBar, { width: scrollBarWidth, left: scrollPosition }]} />
        </View>
      </View>
      {/* Overlap Moduls */}
      {overlapModalLight && (
        <View style={styles.modalOverlay}>
          <Text style={styles.modalText}>Überlappung der Lichteffekte. Akzeptieren passt bestehende an!</Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.button3} onPress={() => setOverlapModalLight(false)}>
              <Text style={styles.buttonText}>Abbrechen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button3} onPress={handleAcceptLightOverlap}>
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
            <TouchableOpacity style={styles.button3} onPress={handleAcceptSoundOverlap}>
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
            <TouchableOpacity style={styles.button3} onPress={handleAccept3DOverlap}>
              <Text style={styles.buttonText}>Akzeptieren</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Second Header */}
      <View style={styles.secoundheader}>
        <TouchableOpacity style={styles.button2} onPress={() => setimportMode(true)}>
          <Text style={styles.buttonText}>Import</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button2} onPress={handleSuchen}>
          <Text style={styles.buttonText}>Suchen</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button2} onPress={handleSave}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Auswahl-Menü */}
      {selectedBoxId !== null && !editMode && (
        <View style={styles.selectedMenu}>
          <Text style={styles.selectedText}>Effekt {selectedBoxId} ausgewählt</Text>
          <TouchableOpacity style={styles.button3} onPress={() => setEditMode(true)}>
            <Text style={styles.buttonText}>Bearbeiten</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button3} onPress={() => console.log('Löschen gedrückt')}>
            <Text style={styles.buttonText}>Löschen</Text>
          </TouchableOpacity>
        </View>
      )}

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

          {/* Segment-Balken für Licht */}
          <Text style={styles.label}>Lichteffekte</Text>
          <View style={styles.segmentContainer}>
            {(() => {
              let prevEnd = 0;
              const tlLength = timelineLengthsPerBox[selectedBoxId] || 1;
              return sortedLight.map((seg, i) => {
                const gap = seg.start - prevEnd;
                const elems: any[] = [];
                if (gap > 0) {elems.push(<View key={`gap-light-${i}`} style={{ flex: gap / tlLength }} />);}
                elems.push(
                  <View key={`seg-light-${i}`} style={[styles.segmentBar, { flex: (seg.end - seg.start) / tlLength, backgroundColor: segmentColors[i % segmentColors.length] }]}>
                    <Text style={styles.segmentText}>{seg.light}</Text>
                  </View>
                );
                prevEnd = seg.end;
                return elems;
              });
            })()}
          </View>

          {/* Segment-Balken für Sound */}
          <Text style={styles.label}>Soundeffekte</Text>
          <View style={styles.segmentContainer}>
            {(() => {
              let prevEnd = 0;
              const tlLength = timelineLengthsPerBox[selectedBoxId] || 1;
              return sortedSound.map((seg, i) => {
                const gap = seg.start - prevEnd;
                const elems: any[] = [];
                if (gap > 0) {elems.push(<View key={`gap-sound-${i}`} style={{ flex: gap / tlLength }} />);}
                elems.push(
                  <View key={`seg-sound-${i}`} style={[styles.segmentBar, { flex: (seg.end - seg.start) / tlLength, backgroundColor: segmentColors[(i + 1) % segmentColors.length] }]}>
                    <Text style={styles.segmentText}>{seg.sound}</Text>
                  </View>
                );
                prevEnd = seg.end;
                return elems;
              });
            })()}
          </View>

          {/* Segment-Balken für 3D */}
          <Text style={styles.label}>3D-Effekte</Text>
          <View style={styles.segmentContainer}>
            {(() => {
              let prevEnd = 0;
              const tlLength = timelineLengthsPerBox[selectedBoxId] || 1;
              return sorted3D.map((seg, i) => {
                const gap = seg.start - prevEnd;
                const elems: any[] = [];
                if (gap > 0) {elems.push(<View key={`gap-3d-${i}`} style={{ flex: gap / tlLength }} />);}
                elems.push(
                  <View key={`seg-3d-${i}`} style={[styles.segmentBar, { flex: (seg.end - seg.start) / tlLength, backgroundColor: segmentColors[(i + 2) % segmentColors.length] }]}>
                    <Text style={styles.segmentText}>{seg.model}</Text>
                  </View>
                );
                prevEnd = seg.end;
                return elems;
              });
            })()}
          </View>

          <Text style={styles.label}>Timeline-Länge:</Text>
          <TextInput
            style={styles.input}
            placeholder="Gesamtlänge in Sekunden"
            keyboardType="numeric"
            value={String(timelineLengthsPerBox[selectedBoxId] || '')}
            onChangeText={text => {
              const num = Number(text) || 0;
              setTimelineLengthsPerBox(prev => ({ ...prev, [selectedBoxId]: num }));
            }}
          />
        </View>
      )}

      {/* Licht Modal */}
      {editLichtEffekte && (
        <View style={styles.editLichtEffekte}>
          <View style={styles.editLichtEffekteTop}>
            <TouchableOpacity style={styles.editButton} onPress={() => setEditLichtEffekte(false)}>
              <Text style={styles.buttonText}>Exit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.editLichtEffekteTop}>
            {['Licht 1', 'Licht 2', 'Licht 3', 'Licht 4'].map(light => (
              <TouchableOpacity key={light} style={styles.editButton} onPress={() => setSelectedLight(light)}>
                <Text style={styles.buttonText}>{light}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Licht inputs */}
      {selectedLight && (
        <View style={styles.selectedLightContainer}>
          <Text style={styles.selectedText}>Ausgewählt: {selectedLight}</Text>
          <TextInput
            style={styles.input}
            placeholder="Startzeit"
            value={startTimeLight}
            onChangeText={setStartTimeLight}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Endzeit"
            value={endTimeLight}
            onChangeText={setEndTimeLight}
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
            <TouchableOpacity style={styles.editButton} onPress={() => setEditSoundEffekte(false)}>
              <Text style={styles.buttonText}>Exit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.editLichtEffekteTop}>
            {['Sound 1', 'Sound 2', 'Sound 3'].map(sound => (
              <TouchableOpacity key={sound} style={styles.editButton} onPress={() => setSelectedSound(sound)}>
                <Text style={styles.buttonText}>{sound}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Sounds inputs*/}
      {selectedSound && (
        <View style={styles.selectedLightContainer}>
          <Text style={styles.selectedText}>Ausgewählt: {selectedSound}</Text>
          <TextInput
            style={styles.input}
            placeholder="Startzeit"
            value={startTimeSound}
            onChangeText={setStartTimeSound}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Endzeit"
            value={endTimeSound}
            onChangeText={setEndTimeSound}
            keyboardType="numeric"
          />
          <View style={styles.modalButtonRow}>
            <TouchableOpacity style={[styles.button3, styles.modalButton]} onPress={() => setSelectedSound(null)}>
              <Text style={styles.buttonText}>Schließen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button3, styles.modalButton]} onPress={handleConfirmSound}>
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
          </View>
          <View style={styles.editLichtEffekteTop}>
            {['Effekt 1', 'Effekt 2', 'Effekt 3'].map(model => (
              <TouchableOpacity key={model} style={styles.editButton} onPress={() => setSelected3D(model)}>
                <Text style={styles.buttonText}>{model}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* 3D Segment Inputs */}
      {selected3D && (
        <View style={styles.selectedLightContainer}>
          <Text style={styles.selectedText}>Ausgewählt: {selected3D}</Text>
          <TextInput
            style={styles.input}
            placeholder="Startzeit"
            value={startTime3D}
            onChangeText={setStartTime3D}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Endzeit"
            value={endTime3D}
            onChangeText={setEndTime3D}
            keyboardType="numeric"
          />
          <View style={styles.modalButtonRow}>
            <TouchableOpacity style={[styles.button3, styles.modalButton]} onPress={() => setSelected3D(null)}>
              <Text style={styles.buttonText}>Schließen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button3, styles.modalButton]} onPress={handleConfirm3D}>
              <Text style={styles.buttonText}>Okay</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {ImportMode && (
        <View style={styles.ImportMode}>
          <Button title="Datei importieren" onPress={importFile} />
          <TouchableOpacity
            style={styles.button}
            onPress={() => setimportMode(false)}>
            <Text style={styles.buttonText}>Cancel Import</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#D9D9D9',
  },
  contentTitle: { fontSize: 18 },
  button: { backgroundColor: '#ddd', padding: 10, borderRadius: 35 },
  button2: { backgroundColor: '#ddd', padding: 10, borderRadius: 35 },
  button3: { backgroundColor: '#ccc', padding: 10, borderRadius: 8 },
  buttonText: { fontSize: 16, textAlign: 'center' },

  scrollContainer: { backgroundColor: '#eee', padding: 10, height: 250, width: '100%' },
  box: {
    width: 100,
    height: 100,
    backgroundColor: '#ccc',
    borderRadius: 8,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 70,
  },
  selectedBox: { backgroundColor: 'lightblue' },
  smallBox: {
    width: 50,
    height: 50,
    backgroundColor: '#ccc',
    borderRadius: 8,
    marginRight: 10,
    marginTop: 100,
  },
  plusButton: {
    width: 50,
    height: 50,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 100,
  },
  plusText: { fontSize: 25, color: '#fff' },
  scrollBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#ccc',
    borderRadius: 4,
    marginTop: 8,
  },
  scrollBar: {
    height: '100%',
    backgroundColor: '#aaa',
    borderRadius: 4,
    position: 'absolute',
    top: 0,
  },

  secoundheader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#eee',
  },
  selectedMenu: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#ccc',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  selectedText: { fontSize: 16, fontWeight: 'bold' },

  editMenu: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: '37%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  editMenuTop: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },

  segmentContainer: {
    flexDirection: 'row',
    height: 20,
    marginVertical: 10,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
  },
  segmentBar: { justifyContent: 'center', alignItems: 'center' },
  segmentText: { fontSize: 10, color: '#fff' },

  editLichtEffekte: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: '75%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  editLichtEffekteTop: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },

  selectedLightContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '33%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  input: {
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
  },
  modalButtonRow: { flexDirection: 'row', marginTop: 10 },
  modalButton: { flex: 1 },
  editButton: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 10, color: '#333' },

  modalOverlay: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
    zIndex: 9999,
  },
  modalText: { fontSize: 16, marginBottom: 15, textAlign: 'center' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-around' },
  ImportMode: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: '85%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
});
