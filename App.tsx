import 'react-native-gesture-handler'
import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import CryptoBubble from './src/cryptoBubble/CryptoBubble';
import Physic from './src/Physic/Physic';
import BestGameEver from './src/GameEngine/BestGameEver';
import Game from './src/FlappyBird';
import { AnimationWithTouchHandler } from './src/RNSkia/AnimationWithTouchHandler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SpawnBoxes } from './src/Box2D/SpawnBoxesScreen';
import CryptoBubbleV2 from './src/CryptoBubbleV2/CryptoBubbleV2';
import CryptoBubbleV3 from './src/CruptoBubbleV3/CryptoBubbleV3';

const App = () => {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaView style={styles.flex1}>
        <StatusBar barStyle={'dark-content'}/>
        <CryptoBubble />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default App;

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  }
})