import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameCatalog } from '../../components/games/GameCatalog';
import { GameCategory } from '../../components/games/GameCatalog/types';
import { colors } from '../../components/games/GameCatalog/constants/colors';

// Top-level screen: owns safe-area padding + navigation wiring,
// delegates all UI/state to GameCatalog.
const GamingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  const handleSelectGame = (category: GameCategory) => {
    // navigation.navigate(category.route, { id: category.id });
    console.log('Navigate to:', category.route);
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
