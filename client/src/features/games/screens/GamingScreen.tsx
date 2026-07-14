import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameCatalog } from '../GameCatalog';
import { GameCategory } from '../GameCatalog/types';
import { colors } from '../GameCatalog/constants/colors';
import { router } from 'expo-router';

// Top-level screen: owns safe-area padding + navigation wiring,
// delegates all UI/state to GameCatalog.
const GamingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  const handleSelectGame = (category: GameCategory) => {
    console.log('Navigate to SelectionWizard with target game route:', category.route);
    router.push({
      pathname: '/games/SelectionWizard' as any,
      params: { gameRoute: category.route as any }
    });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <GameCatalog onSelectGame={handleSelectGame} />
    </View>
  );
};

export default GamingScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
