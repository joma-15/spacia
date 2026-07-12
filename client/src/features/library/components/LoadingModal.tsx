import {
  Modal,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

interface LoadingModalProps {
  visible: boolean;
}

export default function LoadingModal({
  visible,
}: LoadingModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator
            size="large"
            color="#4ADE80"
          />

          <Text style={styles.title}>
            Loading
          </Text>

          <Text style={styles.subtitle}>
            Fetching your flashcards...
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    width: 220,
    paddingVertical: 28,
    paddingHorizontal: 24,

    backgroundColor: "#183427",
    borderRadius: 24,

    borderWidth: 1,
    borderColor: "#2C5A43",

    alignItems: "center",

    shadowColor: "#4ADE80",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },

  title: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#9FB6A8",
    textAlign: "center",
  },
});