// ProgressBar.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type ProgressBarProps = {
  progress: number;      // Aktueller Fortschritt, z. B. 3
  total: number;         // Gesamtteile, z. B. 5
};

const ProgressBar = ({ progress, total }: ProgressBarProps) => {
  const fraction = total > 0 ? progress / total : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Fortschritt: {progress} / {total}</Text>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${fraction * 100}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    alignItems: 'center',
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    color: '#000',
  },
  barBackground: {
    width: 300,
    height: 15,
    backgroundColor: '#ccc',
    borderRadius: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
});

export default ProgressBar;
