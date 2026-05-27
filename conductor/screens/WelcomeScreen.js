// screens/WelcomeScreen.js (Alternative - No Auto Redirect)
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image,
  TouchableOpacity 
} from 'react-native';

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.appName}>Smart Bus Tracking</Text>
      <Text style={styles.tagline}>Your Journey, Our Priority</Text>
      
      {/* Conductor Login Button */}
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('ConductorLogin')}
      >
        <Text style={styles.buttonText}>🚌 Conductor Login</Text>
      </TouchableOpacity>
      
      {/* Admin Button */}
      <TouchableOpacity 
        style={[styles.button, styles.adminButton]}
        onPress={() => navigation.navigate('Admin')}
      >
        <Text style={styles.buttonText}>⚙️ Admin Panel</Text>
      </TouchableOpacity>
      
      <Text style={styles.note}>
        Admin: Upload bus data to Firebase
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: 'white',
    opacity: 0.8,
    marginBottom: 40,
  },
  button: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    minWidth: 200,
  },
  adminButton: {
    backgroundColor: '#1976D2',
    borderWidth: 2,
    borderColor: 'white',
  },
  buttonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  note: {
    marginTop: 30,
    fontSize: 12,
    color: 'white',
    opacity: 0.7,
    textAlign: 'center',
  },
});

export default WelcomeScreen;