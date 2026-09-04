import { View, Text, StyleSheet } from "react-native";

const MemoryMatch = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>putang ina pang apat na game na</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    "flex": 1, 
    "justifyContent": "center", 
    "alignItems" : "center",
  }, 

  text: {
    "color": "red",
    "fontSize" : 25,
  }
});

export default MemoryMatch;