import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

const productName = 'Питомец Финни';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{productName}</Text>
      <Text style={styles.subtitle}>Стартовый каркас M1</Text>
      <Text style={styles.body}>
        Здесь появится игровой путь, который помогает детям планировать,
        покупать и копить вместе с Финни.
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F4FE',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#14324A',
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#23627C',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  body: {
    color: '#14324A',
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 360,
    textAlign: 'center',
  },
});
