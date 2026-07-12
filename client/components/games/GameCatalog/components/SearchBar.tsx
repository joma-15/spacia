import React from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { colors } from "../constants/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = "Search games...",
}) => {
  return (
    <View style={styles.searchBar}>
      <MaterialCommunityIcons
        name="magnify"
        size={22}
        color="#6B7280"
        style={styles.searchIcon}
      />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.searchInput}
        returnKeyType="search"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
      {value.length > 0 && Platform.OS === "android" && (
        <Pressable onPress={() => onChangeText("")} hitSlop={8}>
          <Text style={styles.searchClear}>✕</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgSoft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 4,
    marginTop: 16,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 10,
    opacity: 0.8,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    paddingVertical: 0,
  },
  searchClear: {
    color: colors.textMuted,
    fontSize: 14,
    paddingLeft: 8,
  },
});
