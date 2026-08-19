/**
 * AddCardModal
 * Bottom-sheet modal that lets the user manually create a new flashcard
 * by entering a question and answer.
 */

import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants";

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (question: string, answer: string) => void;
}

const AddCardModal: React.FC<Props> = ({ visible, onClose, onAdd }) => {
  const insets = useSafeAreaInsets();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  /** Validate inputs then delegate to parent and reset form */
  const handleAdd = () => {
    if (!question.trim() || !answer.trim()) {
      Alert.alert("Validation", "Please fill in both question and answer.");
      return;
    }
    onAdd(question.trim(), answer.trim());
    resetAndClose();
  };

  /** Clear form state and close the modal */
  const resetAndClose = () => {
    setQuestion("");
    setAnswer("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={resetAndClose}
    >
      {/*
        NOTE: The dismiss backdrop lives in a plain View OUTSIDE the
        KeyboardAvoidingView. Previously the backdrop was a sibling
        INSIDE the KeyboardAvoidingView, which meant the whole
        full-screen overlay (not just the sheet) resized whenever the
        keyboard opened/closed — that's what caused the visible
        jump/flicker glitch, especially on Android.
      */}
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={resetAndClose}
        />

        <KeyboardAvoidingView
          // On Android the Modal's window is typically already resized
          // by the OS when the keyboard opens (adjustResize). Also
          // applying "height" behavior here double-resizes the view,
          // producing a jarring snap/jump on devices like the Pixel 6.
          // Only iOS needs manual compensation via "padding".
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.bottom : 0}
          style={styles.kbWrapper}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 16) + 24 },
            ]}
          >
            <View style={styles.handle} />
            <Text style={styles.title}>Add New Card</Text>

            <Text style={styles.fieldLabel}>Question</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your question..."
              placeholderTextColor={COLORS.textMuted}
              value={question}
              onChangeText={setQuestion}
              multiline
            />

            <Text style={styles.fieldLabel}>Answer</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter the answer..."
              placeholderTextColor={COLORS.textMuted}
              value={answer}
              onChangeText={setAnswer}
              multiline
            />

            <View style={styles.rowActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={resetAndClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                <Text style={styles.addBtnText}>Add Card</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default AddCardModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  kbWrapper: {
    width: "100%",
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 22,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 18,
  },
  title: { color: COLORS.text, fontSize: 18, fontWeight: "700", marginBottom: 2 },
  fieldLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 5,
    marginTop: 9,
  },
  input: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 11,
    padding: 11,
    color: COLORS.text,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 66,
    textAlignVertical: "top",
  },
  rowActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: { color: COLORS.textMuted, fontWeight: "600", fontSize: 13 },
  addBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 11,
    paddingVertical: 13,
    alignItems: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});