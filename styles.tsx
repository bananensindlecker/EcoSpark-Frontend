import { StyleSheet, Platform, StatusBar } from 'react-native';

export function createStyles(width: number, height: number) {
  const isTablet = width >= 600;
  const scale = isTablet ? 1.3 : 1;

  return StyleSheet.create({
  // Grundcontainer
  container: {
    flex: 1,
    backgroundColor: '#e0ddd5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  // Header oben
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16 * scale,
    backgroundColor: '#d6d5d2',
  },
  secoundheader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14 * scale,
    backgroundColor: '#d6d5d2',
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
    backgroundColor: '#c6c9bf',
    padding: 10 * scale,
    margin: 5 * scale,
    borderRadius: 3 * scale,
  },
  Button: {
    color: '#3E7B27',
    fontSize: 16 * scale,
  },
  buttonText: {
    fontSize: 16 * scale,
    textAlign: 'center',
  },

  // Scroll-Container oberhalb Timeline
  scrollContainer: {
    backgroundColor: '#123524',
    padding: 10 * scale,
    height: 250 * scale,
    width: '100%',
  },

  // Box (Effekt)
  box: {
    width: width * 0.3,
    height: 100 * scale,
    backgroundColor: '#85A947',
    borderRadius: 8 * scale,
    marginRight: 10 * scale,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 70 * scale,
  },
  selectedBox: {
    backgroundColor: '#a7cc68',
  },

  // Gap-Box
  smallBox: {
    width: width * 0.1,
    height: 50 * scale,
    backgroundColor: '#85A947',
    borderRadius: 8 * scale,
    marginRight: 10 * scale,
    marginTop: 100 * scale,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallBoxText: {
    position: 'absolute',
    fontSize: 12 * scale,
    color: '#000',
    marginLeft: 1 * scale,
    marginTop: 1 * scale,
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
    backgroundColor: '#3E7B27',
    borderRadius: 4 * scale,
    marginTop: 8 * scale,
  },
  scrollBar: {
    height: '100%',
    backgroundColor: '#aaa',
    borderRadius: 4 * scale,
    position: 'absolute',
    top: 0,
  },

  // Menü wenn Box selektiert
  selectedMenu: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#d6d5d2',
    padding: 16 * scale,
    borderTopWidth: 1 * scale,
    borderColor: '#ccc',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 290 * scale,
  },
  selectedText: {
    fontSize: 16 * scale,
    fontWeight: 'bold',
  },
  selectedTextDoubleTap: {
    color: 'blue',
    fontSize: 16 * scale,
    fontWeight: 'bold',
  },

  // Bearbeitungsmenü (Swipe-Up)
  editMenu: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: '37%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20 * scale,
    borderTopRightRadius: 20 * scale,
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
  },

  // Timeline-Balken Container
  scrollContainerBalken: {
    flex: 1,
    marginBottom: Platform.OS === 'android' ? 32 * scale : 0,
  },
  label: {
    fontSize: 16 * scale,
    fontWeight: 'bold',
    marginTop: 10 * scale,
    color: '#333',
  },
  segmentContainer: {
    flexDirection: 'row',
    height: 20 * scale,
    marginVertical: 10 * scale,
    backgroundColor: '#eee',
    borderRadius: 4 * scale,
    overflow: 'hidden',
  },
  segmentBar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 10 * scale,
    color: '#fff',
  },

  // Licht-/Sound-/3D-Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    backgroundColor: '#fff',
    padding: 20 * scale,
    borderRadius: 10 * scale,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6 * scale,
    elevation: 10,
    zIndex: 9999,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 8 * scale,
    padding: 20 * scale,
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8 * scale,
    padding: 16 * scale,
  },
  modalTitle: {
    fontSize: 18 * scale,
    fontWeight: 'bold',
    marginBottom: 8 * scale,
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

  // Light-Editor unten
  editLichtEffekte: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: '80%',
    backgroundColor: '#d6d5d2',
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
    marginBottom: 20 * scale,
  },

  // Selected-Light Container
  selectedLightContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20 * scale,
    borderTopRightRadius: 20 * scale,
    padding: 20 * scale,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10 * scale,
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
  },

  // Import-Mode
  ImportMode: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: '85%',
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
    padding: 12 * scale,
    margin: 12 * scale,
    backgroundColor: '#85A947',
    borderRadius: 8 * scale,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft:2,
    marginRight:2,
  },
   connectUiModal: {
      position: 'absolute',
      top: height * 0.2,
      left: width * 0.1,
      right: width * 0.1,
      backgroundColor: '#fff',
      padding: 20 * scale,
      borderRadius: 10 * scale,
      elevation: 10,
    },

    overLengthModal: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      maxHeight: height * 0.5,
      backgroundColor: '#fff',
      borderTopLeftRadius: 20 * scale,
      borderTopRightRadius: 20 * scale,
      padding: 16 * scale,
      elevation: 10,
    },

    newLightModal: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      maxHeight: height * 0.5,
      backgroundColor: '#fff',
      borderTopLeftRadius: 20 * scale,
      borderTopRightRadius: 20 * scale,
      padding: 16 * scale,
      elevation: 10,
    },
     checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  directionLabel: {
    fontSize: 16,
    color: '#333',
  },
  });
}
