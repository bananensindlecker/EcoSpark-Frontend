import { StyleSheet} from 'react-native';

export function createStyles(width: number, height: number) {
  const isTablet = width >= 600;
  const scale = isTablet ? 1.3 : 1;

  return StyleSheet.create({
    // Grundcontainer
    container: {
      flex: 1,
      backgroundColor: 'rgb(32, 31, 31)',
    },

    // Information-Container (äußere Box)
    InformationContainerOuter: {
      position: 'absolute',
      alignSelf: 'center',
      width: 1 * width,                      // bleibt prozentual zur Breite
      height: height * 0.30,             // 30% der Bildschirmhöhe
      backgroundColor: 'rgb(225, 225, 225)',
      elevation: 10,
      overflow: 'hidden',
      borderRadius: 25 * scale,
      zIndex: 10,
      top: '30%',                // 45% der Bildschirmhöhe
    },
    // Information-Container (innere Box)
    InformationContainerInner: {
      position: 'absolute',
      alignSelf: 'center',
      width: '98%',                      // 98% der Eltern-Breite
      height: height * 0.294,            // ~98% von 30% (0.294)
      backgroundColor: 'rgb(225, 225, 225)',
      elevation: 10,
      overflow: 'hidden',
      borderRadius: 25 * scale,
      zIndex: 5,
      top: 2 * scale,                    // etwas Abstand oben in Scale-Einheit
    },
    // Information-Container (aufgeteilte untere Hälfte)
    InformationContainerInnerSplitt: {
      position: 'absolute',
      alignSelf: 'center',
      width: '98%',                      // 98% der Eltern-Breite
      height: height * 0.15,             // 50% von 30% (~0.15)
      backgroundColor: 'rgb(255, 255, 255)',
      overflow: 'hidden',
      borderRadius: 25 * scale,
      elevation: 6,
      zIndex: 5,
      top: 4 * scale,                    // etwas Abstand oben in Scale-Einheit
    },

    zIndex: {
      zIndex: 2,
    },

    // Header-Bereich (Buttons unten)
    Buttons: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      borderTopLeftRadius: 20 * scale,
      borderTopRightRadius: 20 * scale,
      padding: 16 * scale,
      marginLeft: 35 * scale,
      marginRight: 10 * scale,

      // Wichtig für horizontale Anordnung:
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    secoundheader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 14 * scale,
    },

    // Text-Titel
    contentTitle: {
      fontSize: 18 * scale,
    },

    // Buttons (allgemein)
    button: {
      backgroundColor: '#ddd',
      padding: 10 * scale,
      borderRadius: 4 * scale,
    },
    button2: {
      backgroundColor: '#ddd',
      padding: 10 * scale,
      borderRadius: 4 * scale,
    },
    button3: {
      backgroundColor: '#42a265',
      padding: 10 * scale,
      margin: 5 * scale,
      borderRadius: 3 * scale,
    },
    Button: {
      color: '#42a265',
      fontSize: 16 * scale,
    },
    buttonText: {
      fontSize:13 * scale,
      textAlign: 'center',
      color: 'rgb(255, 255, 255)',
    },
    buttonTextBlack: {
      fontSize:13 * scale,
      textAlign: 'center',
      color: 'rgb(0, 0, 0)',
    },
   buttonStartOuter: {
    position: 'absolute',
    alignSelf: 'center',
    width: width * 0.55,      // 45 % der Gesamtbreite statt „scale * 0.45“
    height: height * 0.1,    // 50 % der Gesamt­höhe (wie zuvor)
    top:    height * 0.40,    // 40 % von oben
    zIndex: 10,
    borderRadius: 25,
    elevation: 10,
  },
   buttonStartInner: {
    position: 'absolute',
    alignSelf: 'center',
    width: '97.5%' ,      // 45 % der Gesamtbreite statt „scale * 0.45“
    height: '95%',    // 50 % der Gesamt­höhe (wie zuvor)
    top:    '2.5%',    // 40 % von oben
    zIndex: 11,
    backgroundColor: 'rgb(225, 225, 225)',
    borderRadius: 25,
    elevation: 7,
  },
   buttonStartInnerDisabled : {
    position: 'absolute',
    alignSelf: 'center',
    width: '97.5%' ,      // 45 % der Gesamtbreite statt „scale * 0.45“
    height: '95%',    // 50 % der Gesamt­höhe (wie zuvor)
    top:    '2.5%',    // 40 % von oben
    zIndex: 11,
    backgroundColor: 'rgb(106, 106, 106)',
    borderRadius: 25,
    elevation: 7,
  },
    // Scroll-Container oberhalb Timeline
    EffektContainer: {
      position: 'absolute',
      top: '15%',
      height: 300 * scale ,               // feste Höhe in Scale
      width: '90%',
      zIndex: 0,
      alignSelf: 'center',
    },

    // Box (Effekt)
    box: {
      width: '100%',                // feste Breite in Scale
      height: '100%',               // feste Höhe in Scale
      borderRadius: 8 * scale,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 0,
    },
    selectedBox: {
      backgroundColor: '#fff',
    },

    // Plus-Button
    plusButton: {
      width: 50 * scale,
      height: 50 * scale,
      backgroundColor: '#3E7B27',
      borderRadius: 8 * scale,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10 * scale,
      marginTop: 100 * scale,
    },
    plusText: {
      fontSize: 25 * scale,
      color: '#fff',
    },

    // ScrollBar unten
    scrollBarContainer: {
      width: '100%',
      height: 8 * scale,
      borderRadius: 4 * scale,
      marginTop: 2 * scale,
    },
    scrollBar: {
      height: '100%',
      backgroundColor: '#aaa',
      borderRadius: 4 * scale,
      position: 'absolute',
      top: -65 * scale,                  // vorher: top: -65
      zIndex: 3,
    },

    // Menü wenn Box selektiert
    selectedMenu: {
      position: 'relative',
      left: 0,
      right: 0,
      padding: 16 * scale,
      borderTopWidth: 1 * scale,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    selectedText: {
      fontSize: 16 * scale,
      fontWeight: 'bold',
      color: 'rgb(255, 255, 255)',
    },
    selectedTextDoubleTap: {
      color: 'blue',
      fontSize: 16 * scale,
      fontWeight: 'bold',
    },

    Menu: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      top: '50%',                         // bleibt prozentual
      backgroundColor: '#fff',
      borderTopLeftRadius: 20 * scale,
      borderTopRightRadius: 20 * scale,
      padding: 16 * scale,
      elevation: 10,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 10 * scale,
    },

    // Bearbeitungsmenü (Swipe-Up)
    editMenu: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      top: '5%',                         // bleibt prozentual
      backgroundColor: '#181818',
      padding: 16 * scale,
      elevation: 10,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 10 * scale,
    },
    editMenuTop: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 10 * scale,
      backgroundColor: 'rgb(33, 33, 33)',
    },
    label: {
      fontSize: 16 * scale,
      fontWeight: 'bold',
      marginTop: 330 * scale,
      color: '#333',
    },

    // Licht-/Sound-/3D-Modals (Hintergrund)
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Modal-Overlay (mittig, 10% Abstand links/rechts, 30% von oben)
    modalOverlay: {
      position: 'absolute',
      top: height * 0.30,               // 30% von oben
      left: width * 0.10,               // 10% von links
      right: width * 0.10,              // 10% von rechts
      backgroundColor: 'rgb(32, 31, 31)',
      padding: 20 * scale,
      borderRadius: 10 * scale,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 6 * scale,
      elevation: 20,
      zIndex: 9999,
    },
      modalOverlay2: {
      flex: 1,
      backgroundColor: 'rgb(0, 0, 0)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: 'rgb(32, 31, 31)',
      borderRadius: 8 * scale,
      padding: 20 * scale,
    },
    modalContent: {
      width: '80%',
      backgroundColor: 'rgb(32, 31, 31)',
      borderRadius: 8 * scale,
      padding: 16 * scale,
    },
    modalTitle: {
      fontSize: 18 * scale,
      fontWeight: 'bold',
      marginBottom: 8 * scale,
      alignSelf: 'center',
      color: '#fff',
    },
    modalText: {
      fontSize: 16 * scale,
      marginBottom: 15 * scale,
      textAlign: 'center',
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    modalButtonRow: {
      flexDirection: 'row',
      marginTop: 10 * scale,
    },
    modalButton: {
      flex: 1,
    },
    buttonYes: {
      backgroundColor: '#4CAF50',
      borderRadius: 8 * scale,
      padding: 12 * scale,
      marginHorizontal: 4 * scale,
    },
    buttonNo: {
      backgroundColor: '#F44336',
      borderRadius: 8 * scale,
      padding: 12 * scale,
      marginHorizontal: 4 * scale,
    },

    // Light-Editor (unten)
    editLichtEffekte: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      top: '80%',                         // prozentual
      backgroundColor: 'rgb(22, 21, 21)',
      borderTopLeftRadius: 20 * scale,
      borderTopRightRadius: 20 * scale,
      padding: 16 * scale,
      elevation: 10,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 10 * scale,
    },
    editLichtEffekteTop: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 1 * scale,
    },


    // Form-Input
    input: {
      width: '100%',
      borderColor: '#0a0a0a',
      borderWidth: 1 * scale,
      borderRadius: 8 * scale,
      padding: 10 * scale,
      marginTop: 10 * scale,
      marginBottom: 10 * scale,
      backgroundColor: '#f5f5f5',
      color: 'rgb(0, 0, 0)',
    },

    // Import-Mode (unten)
    ImportMode: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      top: '85%',                        // prozentual
      backgroundColor: '#fff',
      borderTopLeftRadius: 20 * scale,
      borderTopRightRadius: 20 * scale,
      padding: 16 * scale,
      elevation: 10,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 10 * scale,
    },
    editButton: {
      padding: 20 * scale,
      margin: 12 * scale,
      backgroundColor: 'rgb(32, 31, 31)',
      borderRadius: 8 * scale,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 2 * scale,
      marginRight: 2 * scale,
    },
    smallExit: {
      borderRadius: 8 * scale,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 2 * scale,
      marginRight: 2 * scale,
    },

    // Connect-UI-Modal (mittig, 10% links/rechts, 20% oben)
    connectUiModal: {
      position: 'absolute',
      top: height * 0.20,               // 20% von oben
      left: width * 0.10,               // 10% von links
      right: width * 0.10,              // 10% von rechts
      backgroundColor: '#fff',
      padding: 20 * scale,
      borderRadius: 10 * scale,
      elevation: 10,
    },

    // overLength-Modal (unten, max Höhe 50%)
    overLengthModal: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      maxHeight: height * 0.50,         // 50% der Bildschirmhöhe
      backgroundColor: '#fff',
      borderTopLeftRadius: 20 * scale,
      borderTopRightRadius: 20 * scale,
      padding: 16 * scale,
      elevation: 10,
    },

    // newLight-Modal (unten, max Höhe 50%)
    newLightModal: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      maxHeight: height * 0.50,         // 50% der Bildschirmhöhe
      backgroundColor: '#fff',
      borderTopLeftRadius: 20 * scale,
      borderTopRightRadius: 20 * scale,
      padding: 16 * scale,
      elevation: 10,
    },

    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12 * scale,
    },
    directionLabel: {
      fontSize: 16 * scale,
      color: '#fff',
    },
    message: {
      marginTop: 10 * scale,
      fontSize: 14 * scale,
      color: '#ffff',
      alignSelf: 'center',
    },
    status: {
      marginTop: 20 * scale,
      fontSize: 16 * scale,
      color: '#ffff',
      alignSelf: 'center',
    },

    headerBackground: {
      ...StyleSheet.absoluteFillObject,  // deckt volle Fläche ab
      width: '100%',
      height: '100%',
      zIndex: -1,                        // hinter den Text legen
    },
    lengthText: {
      fontSize: 12 * scale,
      color: '#555',
    },
    contentContainer: {
      paddingHorizontal: 20 * scale,
      height: 200 * scale,               // feste Höhe in Scale
    },

    header: {
      fontSize: 24 * scale,
      marginBottom: 20 * scale,
      color: 'white',
      alignSelf: 'center',
    },
    HintergrundText: {
      fontSize: 40 * scale,
      marginLeft: 20 * scale,
      zIndex: 2,
      color: '#ffff',
      fontWeight: '800',
    },
    topImage: {
      position: 'absolute',
      top: -15 * scale,                  // vorher: top: -15
      flex: 1,
      height: height * 0.50,             // 50% der Bildschirmhöhe
      width: width,                      // volle Bildschirmbreite
      zIndex: 1,
      borderRadius: 25 * scale,
    },
    container2: {
      position: 'relative',
      alignSelf: 'center',
    },
    dashedBorder: {
      position: 'absolute',
      top: 0 * scale,
      bottom: 0,
      left: 0,
      right: 0,
      borderRadius: 12 * scale,
      borderWidth: 2 * scale,
      borderStyle: 'dashed',
      borderColor: '#569947',
      elevation: 10,
    },
    buttonPing: {
      paddingHorizontal: 32 * scale,
      paddingVertical: 16 * scale,
      borderWidth: 2 * scale,
      borderColor: '#569947',
      borderRadius: 12 * scale,
      backgroundColor: 'transparent',
      shadowOffset: { width: 6 * scale, height: 6 * scale },
      shadowRadius: 10 * scale,
      shadowOpacity: 0.6,
      zIndex: 5,
    },
    text: {
      fontWeight: '700',
      fontSize: 18 * scale,
      textAlign: 'center',
      // Farbe initial wird jetzt animiert, also hier nicht setzen
    },
    pingCircle: {
      position: 'absolute',
      width: 16 * scale,
      height: 16 * scale,
      backgroundColor: '#10522a',
      borderRadius: 8 * scale,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowRadius: 10 * scale,
      shadowOpacity: 0.6,
    },
    smallPingCircle: {
      position: 'absolute',
      width: 12 * scale,
      height: 12 * scale,
      backgroundColor: '#f8a42a',
      borderRadius: 6 * scale,
    },
    topRightPing: {
      top: -8 * scale,
      right: -8 * scale,
    },
    bottomLeftPing: {
      bottom: -8 * scale,
      left: -8 * scale,
    },
    leftCenterPing: {
      top: '-2%',   // Prozent bleibt, passt sich an Höhe an
      left: 2 * scale,
      opacity: 0.7,
    },
    rightCenterPing: {
      top: '88%',  // Prozent bleibt
      right: -2 * scale,
      opacity: 0.7,
    },
    timelineContainer: {
      flex: 1,
      backgroundColor: '#121212',
      borderRadius: 8,
      paddingVertical: 8,
    },
    playheadLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    marginLeft: -1,
    width: 2,
    backgroundColor: 'red',
    zIndex: 10,
  },
   groupLabel: {
    color: '#CCCCCC',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  timelineRow: {
    flexDirection: 'row',
    height: 40,
    backgroundColor: '#1E1E1E',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
  },
  timelineBlock: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 4,
    height: '100%',
  },
  blockText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
    highlightedBlock: {
      borderWidth: 2,
      borderColor: '#FFD700',
    },
    iconLabel: {
    color: '#FFFFFF',
    fontSize:24,
    textAlign: 'center',
  },
  labelsColumn: {
  width: 100,           // Breite der Label-Spalte (anpassen nach Bedarf)
  paddingRight: 8,
  },
  offsetButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    backgroundColor: '#555',
    borderRadius: 4,
  },
  offsetButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  offsetControls: {
  flexDirection: 'row',      // Anordnung der Buttons nebeneinander
  justifyContent: 'center',  // zentriert im Container
  marginTop: 8,              // Abstand nach oben
},
  });
}
