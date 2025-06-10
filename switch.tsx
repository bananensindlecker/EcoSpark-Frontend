/* eslint-disable react-native/no-inline-styles */
import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, LayoutChangeEvent } from 'react-native';

type Props = {
  selectedTab: 'Build' | 'Start';
  onTabChange: (tab: 'Build' | 'Start') => void;
};

export default function StatsSwitcher({ selectedTab, onTabChange }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const tabWidth = useRef(0);

  // animiere translateX beim Tab-Wechsel
  useEffect(() => {
    const toValue = selectedTab === 'Build' ? 0 : tabWidth.current;
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      tension: 150,
      friction: 20,
    }).start();
  }, [selectedTab, translateX]);

  // Tab-Breite beim ersten Rendern ermitteln
  const handleLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width / 2;
    tabWidth.current = width;
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container} onLayout={handleLayout}>
        {/* Gleitender Hintergrund */}
        <Animated.View
          style={[
            styles.slider,
            {
              transform: [{ translateX }],
              width: '50%',
            },
          ]}
        />

        {/* Tabs */}
        <Pressable style={styles.tab} onPress={() => onTabChange('Build')}>
          <Text style={[styles.label, selectedTab === 'Build' && styles.labelActive]}>
            Build
          </Text>
        </Pressable>

        <Pressable style={styles.tab} onPress={() => onTabChange('Start')}>
          <Text style={[styles.label, selectedTab === 'Start' && styles.labelActive]}>
            Start
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    marginVertical: 40,
    width: '40%',
    zIndex:2,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#F2F3F5',
    borderRadius: 20,
    padding: 4,
    position: 'relative',
    overflow: 'hidden',
    elevation: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, // damit Text über dem Slider liegt
  },
  slider: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    zIndex: 0,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    color: '#8E8E93',
  },
  labelActive: {
    color: '#569947',
    fontWeight: '600',
  },
});
