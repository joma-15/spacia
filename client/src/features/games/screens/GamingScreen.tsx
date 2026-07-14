import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameCatalog } from '../GameCatalog';
import { GameCategory } from '../GameCatalog/types';
import { colors } from '../GameCatalog/constants/colors';
import { useRouter } from 'expo-router';

// Top-level screen: owns safe-area padding + navigation wiring,
// delegates all UI/state to GameCatalog.
const GamingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleSelectGame = (category: GameCategory) => {
    // navigation.navigate(category.route, { id: category.id });
    console.log('Navigate to:', category.route);
    // router.push(category.route);
    router.push('/games/SelectionWizard');
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
