// screens/ConductorLoginScreen.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { database } from '../firebase/config';
import { ref, get } from 'firebase/database';

const ConductorLoginScreen = ({ navigation }) => {
  const [busNumber, setBusNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!busNumber.trim() || !driverName.trim()) {
      Alert.alert('Error', 'Please enter both bus number and driver name');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Attempting login for:', { busNumber, driverName });
      
      // Search for the bus in Firebase
      const busesRef = ref(database, 'buses');
      const snapshot = await get(busesRef);
      
      if (snapshot.exists()) {
        const buses = snapshot.val();
        console.log('📊 Found buses in Firebase:', Object.keys(buses).length);
        
        const busKey = Object.keys(buses).find(key => {
          const bus = buses[key];
          const dbBusNumber = bus.BusNumber || '';
          const inputBusNumber = busNumber.trim().toUpperCase();
          
          console.log(`🔍 Comparing: DB="${dbBusNumber}" vs Input="${inputBusNumber}"`);
          
          return dbBusNumber.toUpperCase() === inputBusNumber;
        });

        if (busKey) {
          const busData = buses[busKey];
          console.log('✅ Bus found:', busData);
          
          // Safe check for driver name
          const storedDriverName = busData.DriverName || '';
          const inputDriverName = driverName.trim();
          
          console.log(`👤 Driver check: DB="${storedDriverName}" vs Input="${inputDriverName}"`);
          
          // More flexible driver name matching
          if (storedDriverName.toLowerCase().includes(inputDriverName.toLowerCase()) || 
              inputDriverName.toLowerCase().includes(storedDriverName.toLowerCase())) {
            
            console.log('✅ Login successful, navigating to Conductor screen');
            
            // Successful login - navigate to ConductorScreen with bus data
            navigation.navigate('Conductor', { 
              busData: {
                ...busData,
                busId: busKey
              }
            });
          } else {
            Alert.alert(
              'Authentication Failed', 
              `Driver name does not match.\n\nBus: ${busData.BusNumber}\nExpected: ${storedDriverName || 'Not specified'}\nYou entered: ${inputDriverName}`
            );
          }
        } else {
          Alert.alert(
            'Bus Not Found', 
            `No bus found with number: ${busNumber}\n\nCheck the bus number or upload data via Admin panel.`
          );
        }
      } else {
        Alert.alert(
          'No Bus Data', 
          'No bus data found in database.\n\nPlease go to Admin panel and upload bus data first.'
        );
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      Alert.alert('Error', `Failed to login: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Debug function to check Firebase data
  const checkFirebaseData = async () => {
    try {
      setIsLoading(true);
      const busesRef = ref(database, 'buses');
      const snapshot = await get(busesRef);
      
      if (snapshot.exists()) {
        const buses = snapshot.val();
        const busCount = Object.keys(buses).length;
        
        console.log('📊 Firebase Bus Data:', buses);
        
        // Show first 5 buses in alert
        const availableBuses = Object.entries(buses).slice(0, 5).map(([key, bus]) => {
          return `• ${bus.BusNumber || 'N/A'} - ${bus.DriverName || 'N/A'}`;
        });
        
        const message = `Total buses: ${busCount}\n\nFirst 5 buses:\n${availableBuses.join('\n')}${
          busCount > 5 ? `\n\n... and ${busCount - 5} more` : ''
        }`;
        
        Alert.alert(
          '📊 Firebase Bus Data',
          message,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          '❌ No Data', 
          'No bus data found in Firebase.\n\nGo to Admin panel and click "Upload All Bus Data"'
        );
      }
    } catch (error) {
      console.error('❌ Debug error:', error);
      Alert.alert('❌ Debug Error', `Failed to fetch Firebase data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill for testing
  const fillTestData = () => {
    setBusNumber('AP39Z0868');
    setDriverName('K NARASHUDU');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Conductor Login</Text>
      
      <View style={styles.loginForm}>
        <TextInput
          style={styles.input}
          placeholder="Enter Bus Number (e.g., AP39Z0868)"
          value={busNumber}
          onChangeText={setBusNumber}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Enter Driver Name"
          value={driverName}
          onChangeText={setDriverName}
          autoCapitalize="words"
        />
        
        <TouchableOpacity 
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.loginButtonText}>🚌 Login as Conductor</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.testButton}
          onPress={fillTestData}
          disabled={isLoading}
        >
          <Text style={styles.testButtonText}>🧪 Fill Test Data</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.debugButton}
          onPress={checkFirebaseData}
          disabled={isLoading}
        >
          <Text style={styles.debugButtonText}>🔍 Check Firebase Data</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>Login Instructions:</Text>
        <Text style={styles.instruction}>1. Go to Admin panel first and upload bus data</Text>
        <Text style={styles.instruction}>2. Enter exact bus number (e.g., AP39Z0868)</Text>
        <Text style={styles.instruction}>3. Enter driver name (partial match accepted)</Text>
        <Text style={styles.instruction}>4. Use "Check Firebase Data" to verify upload</Text>
        <Text style={styles.instruction}>5. Use "Fill Test Data" for quick testing</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  loginForm: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  loginButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  debugButton: {
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#666',
  },
  backButtonText: {
    color: 'white',
    fontSize: 14,
  },
  instructions: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  instruction: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
  },
});

export default ConductorLoginScreen;