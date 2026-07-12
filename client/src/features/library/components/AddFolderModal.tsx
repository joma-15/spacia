/**
 * AddFolderModal.tsx
 * ─────────────────────────────────────────────
 * Bottom-sheet modal for creating a new subject folder.
 *
 * The user can:
 *  1. Type a subject name
 *  2. Pick a folder accent color from the color swatch row
 *  3. See a live preview of how the folder label will look
 *  4. Confirm or cancel
 *
 * Local state (subject text, selected color) lives here because
 * nothing outside this modal needs to know about it mid-edit.
 */

import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ACCENT_COLORS } from "../constants";
import { THEME } from "../theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called with the finished subject name and chosen color when user taps "Create" */
  onAdd: (subject: string, accentColor: string) => void;
}

const AddFolderModal: React.FC<Props> = ({ visible, onClose, onAdd }) => {
  const insets = useSafeAreaInsets();

  // ── Local form state ──────────────────────────────────────────────────────
  const [subject, setSubject] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>(THEME.folderGreen);

  // ── Handlers ─────────────────────────────────────────────────────────────

  /** Validate then pass data up to the parent and close */
  const handleConfirm = (): void => {
    if (!subject.trim()) {
      Alert.alert("Validation", "Please enter a subject name.");
      return;
    }
    onAdd(subject.trim(), selectedColor);
    resetAndClose();
  };

  /** Reset form fields and close the modal */
  const resetAndClose = (): void => {
    setSubject("");
    setSelectedColor(THEME.folderGreen);
    onClose();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      {/* KeyboardAvoidingView pushes the sheet up when the keyboard opens */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        {/* Tapping the dark backdrop dismisses the modal */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={resetAndClose}
        />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}>

          {/* ── Drag handle (visual hint that this sheet can be swiped) ── */}
          <View style={styles.handle} />

          <Text style={styles.title}>New Subject Folder</Text>

          {/* ── Subject name input ── */}
          <Text style={styles.fieldLabel}>Subject Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Chemistry, History..."
            placeholderTextColor={THEME.textMuted}
            value={subject}
            onChangeText={setSubject}
            autoFocus
          />

          {/* ── Color swatch picker ── */}
          <Text style={styles.fieldLabel}>Folder Color</Text>
          <View style={styles.colorRow}>
            {ACCENT_COLORS.map((colorOption) => (
              <TouchableOpacity
                key={colorOption.value}
                onPress={() => setSelectedColor(colorOption.value)}
                style={[
                  styles.colorDot,
                  { backgroundColor: colorOption.value },
                  selectedColor === colorOption.value && styles.colorDotSelected,
                ]}
              />
            ))}
          </View>

          {/* ── Live preview of the folder label ── */}
          <View style={[
            styles.preview,
            { backgroundColor: selectedColor + "22", borderColor: selectedColor + "55" },
          ]}>
            <Text style={[styles.previewText, { color: selectedColor }]}>
              📂 {subject || "Subject Name"}
            </Text>
          </View>

          {/* ── Cancel / Create buttons ── */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={resetAndClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmText}>Create Folder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddFolderModal;

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    backgroundColor: THEME.bgElevated,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, borderWidth: 1, borderColor: THEME.borderBright,
  },
  handle: {
    width: 40, height: 4, backgroundColor: THEME.border,
    borderRadius: 2, alignSelf: "center", marginBottom: 20,
  },
  title: { color: THEME.textWhite, fontSize: 20, fontWeight: "700", marginBottom: 4 },

  fieldLabel: {
    color: THEME.textMuted, fontSize: 11, textTransform: "uppercase",
    letterSpacing: 1, marginBottom: 8, marginTop: 16,
  },
  input: {
    backgroundColor: THEME.bg, borderRadius: 12, padding: 13,
    color: THEME.textWhite, fontSize: 15, borderWidth: 1, borderColor: THEME.borderBright,
  },

  colorRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  colorDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: "transparent" },
  colorDotSelected: { borderColor: THEME.textWhite, transform: [{ scale: 1.2 }] },

  preview: {
    marginTop: 16, borderRadius: THEME.radiusMd,
    paddingVertical: 14, paddingHorizontal: 16,
    borderWidth: 1, alignItems: "center",
  },
  previewText: { fontSize: 15, fontWeight: "700" },

  actions: { flexDirection: "row", gap: 10, marginTop: 20 },
  cancelBtn: {
    flex: 1, backgroundColor: THEME.bg, borderRadius: 12,
    paddingVertical: 13, alignItems: "center",
    borderWidth: 1, borderColor: THEME.border,
  },
  cancelText: { color: THEME.textMuted, fontWeight: "600", fontSize: 14 },
  confirmBtn: { flex: 2, backgroundColor: THEME.primary, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  confirmText: { color: THEME.bg, fontWeight: "700", fontSize: 15 },
});