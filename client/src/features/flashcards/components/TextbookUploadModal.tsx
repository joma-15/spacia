import * as DocumentPicker from "expo-document-picker";
import React, { useState } from "react";
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../constants";
import type { TextbookUpload } from "../hooks/useFlashCards";

interface Props {
  visible: boolean;
  onClose: () => void;
  onGenerate: (file: TextbookUpload) => Promise<boolean>;
}

/** MIME types understood by both the native picker and the Flask upload route. */
const TEXTBOOK_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const formatBytes = (bytes?: number) => {
  if (bytes === undefined) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

export default function TextbookUploadModal({ visible, onClose, onGenerate }: Props) {
  const insets = useSafeAreaInsets();
  const [file, setFile] = useState<TextbookUpload | null>(null);

  /** Clear the previous selection so reopening the modal always starts fresh. */
  const close = () => {
    setFile(null);
    onClose();
  };

  /** The picker copies the file into the app cache, keeping its URI readable during upload. */
  const chooseFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: TEXTBOOK_TYPES, copyToCacheDirectory: true });
      if (result.canceled) return;

      const selected = result.assets[0];
      if (!selected) return;
      
      // This mirrors the server limit and gives immediate feedback before upload.
      if (selected.size && selected.size > 20 * 1024 * 1024) {
        Alert.alert("File too large", "Choose a textbook that is 20 MB or smaller.");
        return;
      }

      setFile({
        uri: selected.uri,
        name: selected.name,
        mimeType: selected.mimeType,
        size: selected.size,
      });
    } catch (err) {
      console.error("Failed to select document:", err);
      Alert.alert("Error", "Failed to select document.");
    }
  };

  /** Leave the sheet open on failure so the user can choose a different file. */
  const generate = async () => {
    if (!file) {
      Alert.alert("Choose a textbook", "Select an English PDF or DOCX textbook first.");
      return;
    }
    if (await onGenerate(file)) close();
  };

  const getFileIcon = (mimeType?: string | null) => {
    if (mimeType === "application/pdf") {
      return { name: "file-pdf-box" as const, color: "#e74c3c" };
    }
    if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType?.includes("word")
    ) {
      return { name: "file-word-box" as const, color: "#2980b9" };
    }
    return { name: "file-document-outline" as const, color: COLORS.primary };
  };

  const fileIconInfo = file ? getFileIcon(file.mimeType) : null;

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={close} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Generate Flashcards</Text>
              <Text style={styles.subtitle}>AI-Powered Study Deck Creator</Text>
            </View>
            <TouchableOpacity style={styles.closeIconButton} onPress={close}>
              <MaterialCommunityIcons name="close" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* ── Drag & Drop style Upload Zone ── */}
          {!file ? (
            <TouchableOpacity style={styles.uploadZone} onPress={chooseFile} activeOpacity={0.8}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="cloud-upload-outline" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.uploadTitle}>Choose a textbook file</Text>
              <Text style={styles.uploadSubtitle}>PDF or DOCX documents up to 20 MB</Text>
              <View style={styles.badgeContainer}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>English Only</Text>
                </View>
                <View style={[styles.badge, styles.badgeSecondary]}>
                  <Text style={styles.badgeText}>Max 20MB</Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.fileCard}>
              <MaterialCommunityIcons
                name={fileIconInfo?.name ?? "file-document-outline"}
                size={40}
                color={fileIconInfo?.color ?? COLORS.primary}
              />
              <View style={styles.fileDetails}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.name}
                </Text>
                <Text style={styles.fileMeta}>
                  {formatBytes(file.size)} • {file.name.split(".").pop()?.toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity style={styles.removeButton} onPress={() => setFile(null)}>
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          )}

          {/* ── How it works guide ── */}
          <View style={styles.guideContainer}>
            <Text style={styles.guideTitle}>How it works</Text>
            
            <View style={styles.guideStep}>
              <View style={styles.stepIconContainer}>
                <MaterialCommunityIcons name="numeric-1-circle" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.stepText}>Select a PDF or DOCX English textbook chapter.</Text>
            </View>

            <View style={styles.guideStep}>
              <View style={styles.stepIconContainer}>
                <MaterialCommunityIcons name="numeric-2-circle" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.stepText}>AI scans the text to extract core concepts, terms, and explanations.</Text>
            </View>

            <View style={styles.guideStep}>
              <View style={styles.stepIconContainer}>
                <MaterialCommunityIcons name="numeric-3-circle" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.stepText}>Your deck is instantly updated with fully formatted study cards.</Text>
            </View>
          </View>

          {/* ── Actions ── */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={close}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.generateButton, !file && styles.generateButtonDisabled]}
              onPress={generate}
              disabled={!file}
            >
              <MaterialCommunityIcons name="flash-outline" size={16} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.generateText}>Generate Cards</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  closeIconButton: {
    backgroundColor: COLORS.surfaceElevated,
    padding: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  uploadZone: {
    backgroundColor: COLORS.surfaceElevated,
    borderStyle: "dashed",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(46, 204, 113, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  uploadTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
  },
  uploadSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  badgeContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  badge: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  badgeSecondary: {
    backgroundColor: "rgba(46, 204, 113, 0.12)",
    borderColor: "rgba(46, 204, 113, 0.2)",
  },
  badgeText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "600",
  },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  fileDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  fileName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
  fileMeta: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  removeButton: {
    backgroundColor: "rgba(192, 57, 43, 0.08)",
    padding: 8,
    borderRadius: 10,
  },
  guideContainer: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  guideTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  guideStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  stepIconContainer: {
    marginRight: 8,
    marginTop: 1,
  },
  stepText: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelText: {
    color: COLORS.textMuted,
    fontWeight: "600",
    fontSize: 14,
  },
  generateButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  generateButtonDisabled: {
    backgroundColor: COLORS.primaryDim,
    opacity: 0.5,
  },
  buttonIcon: {
    marginRight: 6,
  },
  generateText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
