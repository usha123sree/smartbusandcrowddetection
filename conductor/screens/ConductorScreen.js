import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  TextInput, 
  Modal 
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { database } from '../firebase/config';
import { ref, update, push, onValue, off } from 'firebase/database';

const ConductorScreen = ({ route, navigation }) => {
  const { busData } = route.params;
  const [location, setLocation] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [currentBusData, setCurrentBusData] = useState({
    ...busData,
    routeCounts: busData.routeCounts || {},
    currentCount: busData.currentCount || 0
  });
  const [locationSubscription, setLocationSubscription] = useState(null);

  const [ticketForm, setTicketForm] = useState({
    source: '',
    destination: '',
    passengerType: 'adult',
    fare: 0,
    paymentMethod: 'cash'
  });

  // Complete fare matrix based on stops for different routes
  const fareMatrix = {
    'KURNOOL': {
      'ORVAKAL': 10,
      'BETHAMCHERLA': 20,
      'BANAGANAPALLY': 35,
      'KOILAKUNTLA': 45,
      'JAMMALAMADUGU': 55,
      'PRODDUTUR': 65,
      'DEVAGUDI': 70,
      'GUNDLAKUNTA': 60,
      'NOSSAM': 50,
      'MAYALURU': 40
    },
    'ORVAKAL': {
      'KURNOOL': 10,
      'BETHAMCHERLA': 10,
      'BANAGANAPALLY': 25,
      'KOILAKUNTLA': 35,
      'JAMMALAMADUGU': 45,
      'PRODDUTUR': 55,
      'DEVAGUDI': 60,
      'GUNDLAKUNTA': 50,
      'NOSSAM': 40,
      'MAYALURU': 30
    },
    'BETHAMCHERLA': {
      'KURNOOL': 20,
      'ORVAKAL': 10,
      'BANAGANAPALLY': 15,
      'KOILAKUNTLA': 25,
      'JAMMALAMADUGU': 35,
      'PRODDUTUR': 45,
      'DEVAGUDI': 50,
      'GUNDLAKUNTA': 40,
      'NOSSAM': 30,
      'MAYALURU': 20
    },
    'BANAGANAPALLY': {
      'KURNOOL': 35,
      'ORVAKAL': 25,
      'BETHAMCHERLA': 15,
      'KOILAKUNTLA': 10,
      'JAMMALAMADUGU': 20,
      'PRODDUTUR': 30,
      'DEVAGUDI': 35,
      'GUNDLAKUNTA': 25,
      'NOSSAM': 15,
      'MAYALURU': 10
    },
    'KOILAKUNTLA': {
      'KURNOOL': 45,
      'ORVAKAL': 35,
      'BETHAMCHERLA': 25,
      'BANAGANAPALLY': 10,
      'JAMMALAMADUGU': 10,
      'PRODDUTUR': 20,
      'DEVAGUDI': 25,
      'GUNDLAKUNTA': 15,
      'NOSSAM': 10,
      'MAYALURU': 5
    },
    'JAMMALAMADUGU': {
      'KURNOOL': 55,
      'ORVAKAL': 45,
      'BETHAMCHERLA': 35,
      'BANAGANAPALLY': 20,
      'KOILAKUNTLA': 10,
      'PRODDUTUR': 10,
      'DEVAGUDI': 15,
      'GUNDLAKUNTA': 5,
      'NOSSAM': 8,
      'MAYALURU': 12
    },
    'PRODDUTUR': {
      'KURNOOL': 65,
      'ORVAKAL': 55,
      'BETHAMCHERLA': 45,
      'BANAGANAPALLY': 30,
      'KOILAKUNTLA': 20,
      'JAMMALAMADUGU': 10,
      'DEVAGUDI': 8,
      'GUNDLAKUNTA': 12,
      'NOSSAM': 18,
      'MAYALURU': 22
    },
    'DEVAGUDI': {
      'KURNOOL': 70,
      'ORVAKAL': 60,
      'BETHAMCHERLA': 50,
      'BANAGANAPALLY': 35,
      'KOILAKUNTLA': 25,
      'JAMMALAMADUGU': 15,
      'PRODDUTUR': 8,
      'GUNDLAKUNTA': 10,
      'NOSSAM': 15,
      'MAYALURU': 20
    },
    'GUNDLAKUNTA': {
      'KURNOOL': 60,
      'ORVAKAL': 50,
      'BETHAMCHERLA': 40,
      'BANAGANAPALLY': 25,
      'KOILAKUNTLA': 15,
      'JAMMALAMADUGU': 5,
      'PRODDUTUR': 12,
      'DEVAGUDI': 10,
      'NOSSAM': 8,
      'MAYALURU': 12
    },
    'NOSSAM': {
      'KURNOOL': 50,
      'ORVAKAL': 40,
      'BETHAMCHERLA': 30,
      'BANAGANAPALLY': 15,
      'KOILAKUNTLA': 10,
      'JAMMALAMADUGU': 8,
      'PRODDUTUR': 18,
      'DEVAGUDI': 15,
      'GUNDLAKUNTA': 8,
      'MAYALURU': 5
    },
    'MAYALURU': {
      'KURNOOL': 40,
      'ORVAKAL': 30,
      'BETHAMCHERLA': 20,
      'BANAGANAPALLY': 10,
      'KOILAKUNTLA': 5,
      'JAMMALAMADUGU': 12,
      'PRODDUTUR': 22,
      'DEVAGUDI': 20,
      'GUNDLAKUNTA': 12,
      'NOSSAM': 5
    },
    'HYDERABAD MGBS': {
      'PRODDUTUR': 450,
      'KURNOOL': 350
    },
    'TIRUPATHI': {
      'PRODDUTUR': 380,
      'KADAPA': 280,
      'RAJAMPET': 220
    },
    'CHAPADU': {
      'PRODDUTUR': 40,
      'MYDUKUR': 30,
      'KHAJIPET': 50,
      'KADAPA': 70
    },
    'MYDUKUR': {
      'PRODDUTUR': 30,
      'CHAPADU': 30,
      'KHAJIPET': 20,
      'KADAPA': 40
    },
    'KHAJIPET': {
      'PRODDUTUR': 50,
      'CHAPADU': 50,
      'MYDUKUR': 20,
      'KADAPA': 20
    },
    'KADAPA': {
      'PRODDUTUR': 70,
      'CHAPADU': 70,
      'MYDUKUR': 40,
      'KHAJIPET': 20,
      'BAKARAPET': 15,
      'ONTIMITA': 30,
      'NANDALUR': 45,
      'RAJAMPET': 60,
      'TIRUPATHI': 280
    },
    'BAKARAPET': {
      'KADAPA': 15,
      'ONTIMITA': 15,
      'NANDALUR': 30,
      'RAJAMPET': 45
    },
    'ONTIMITA': {
      'KADAPA': 30,
      'BAKARAPET': 15,
      'NANDALUR': 15,
      'RAJAMPET': 30
    },
    'NANDALUR': {
      'KADAPA': 45,
      'BAKARAPET': 30,
      'ONTIMITA': 15,
      'RAJAMPET': 15,
      'PULLAMPET': 20,
      'KODUR': 35
    },
    'RAJAMPET': {
      'KADAPA': 60,
      'BAKARAPET': 45,
      'ONTIMITA': 30,
      'NANDALUR': 15,
      'PULLAMPET': 10,
      'KODUR': 25,
      'TIRUPATHI': 220
    },
    'PULLAMPET': {
      'RAJAMPET': 10,
      'NANDALUR': 20,
      'KODUR': 15,
      'RENIGUNTA': 50
    },
    'KODUR': {
      'RAJAMPET': 25,
      'NANDALUR': 35,
      'PULLAMPET': 15,
      'RENIGUNTA': 35,
      'TIRUPATHI': 180
    },
    'RENIGUNTA': {
      'PULLAMPET': 50,
      'KODUR': 35,
      'TIRUPATHI': 15
    }
  };

  // Passenger type multipliers
  const passengerMultipliers = {
    adult: 1.0,
    child: 0.5,
    senior: 0.7
  };

  useEffect(() => {
    // Listen for real-time updates to this bus
    const busRef = ref(database, `buses/${busData.busId}`);
    const unsubscribe = onValue(busRef, (snapshot) => {
      if (snapshot.exists()) {
        const updatedBusData = snapshot.val();
        setCurrentBusData(updatedBusData);
        setIsSharing(updatedBusData.isActive || false);
        
        if (updatedBusData.location) {
          setLocation({
            latitude: updatedBusData.location.lat,
            longitude: updatedBusData.location.lng
          });
        }
      }
    });

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      off(busRef, 'value', unsubscribe);
    };
  }, [busData.busId]);

  const requestLocationPermission = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location access needed to share bus location.');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Location permission error:', error);
      return false;
    }
  };

  const startSharingLocation = async () => {
    setIsLoading(true);
    
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setIsLoading(false);
      return;
    }

    try {
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      
      setLocation(currentLocation.coords);
      setIsSharing(true);
      
      await updateBusInFirebase({
        location: {
          lat: currentLocation.coords.latitude,
          lng: currentLocation.coords.longitude
        },
        isActive: true
      });

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        async (newLocation) => {
          const { latitude, longitude } = newLocation.coords;
          setLocation(newLocation.coords);
          
          await updateBusInFirebase({
            location: { lat: latitude, lng: longitude },
            lastUpdated: Date.now()
          });
        }
      );

      setLocationSubscription(subscription);
      
      Alert.alert('Location Sharing Started', 'Passengers can now track this bus in real-time!');
    } catch (error) {
      console.error('Error starting location sharing:', error);
      Alert.alert('Error', 'Failed to start location sharing.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopSharingLocation = async () => {
    try {
      if (locationSubscription) {
        locationSubscription.remove();
        setLocationSubscription(null);
      }
      
      setIsSharing(false);
      
      await updateBusInFirebase({
        isActive: false,
        location: null
      });

      Alert.alert('Location Sharing Stopped', 'Bus is no longer visible to passengers.');
    } catch (error) {
      console.error('Error stopping location sharing:', error);
    }
  };

  const updateBusInFirebase = async (newData) => {
    try {
      const busRef = ref(database, `buses/${busData.busId}`);
      await update(busRef, {
        ...newData,
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error('Firebase update error:', error);
      throw error;
    }
  };

  const getStopNames = () => {
    if (!currentBusData.STOPROUTES) return [];
    
    const stops = currentBusData.STOPROUTES.split('-').map(stop => stop.trim());
    return stops;
  };

  const calculateFare = (source, destination, passengerType = 'adult') => {
    if (!source || !destination) return 0;
    
    const sourceUpper = source.toUpperCase().trim();
    const destUpper = destination.toUpperCase().trim();
    
    // Check if source exists in fare matrix
    if (fareMatrix[sourceUpper]) {
      // Check if destination exists for this source
      if (fareMatrix[sourceUpper][destUpper]) {
        const baseFare = fareMatrix[sourceUpper][destUpper];
        const multiplier = passengerMultipliers[passengerType] || 1.0;
        const calculatedFare = Math.round(baseFare * multiplier);
        return calculatedFare;
      } else {
        // Try to find approximate fare based on route distance
        return calculateApproximateFare(sourceUpper, destUpper, passengerType);
      }
    } else {
      // Try to find approximate fare based on route distance
      return calculateApproximateFare(sourceUpper, destUpper, passengerType);
    }
  };

  const calculateApproximateFare = (source, destination, passengerType) => {
    // If exact fare not found, calculate approximate fare based on route
    const allStops = getStopNames().map(stop => stop.toUpperCase());
    const sourceIndex = allStops.indexOf(source);
    const destIndex = allStops.indexOf(destination);
    
    if (sourceIndex !== -1 && destIndex !== -1) {
      const stopCount = Math.abs(destIndex - sourceIndex);
      const baseFare = stopCount * 8; // ₹8 per stop as approximation
      const multiplier = passengerMultipliers[passengerType] || 1.0;
      const calculatedFare = Math.max(5, Math.round(baseFare * multiplier));
      return calculatedFare;
    }
    
    return 0;
  };

  const handleSourceChange = (source) => {
    const newForm = {
      ...ticketForm,
      source,
      fare: source && ticketForm.destination ? 
        calculateFare(source, ticketForm.destination, ticketForm.passengerType) : 0
    };
    setTicketForm(newForm);
  };

  const handleDestinationChange = (destination) => {
    const newForm = {
      ...ticketForm,
      destination,
      fare: ticketForm.source && destination ? 
        calculateFare(ticketForm.source, destination, ticketForm.passengerType) : 0
    };
    setTicketForm(newForm);
  };

  const handlePassengerTypeChange = (passengerType) => {
    const newForm = {
      ...ticketForm,
      passengerType,
      fare: ticketForm.source && ticketForm.destination ? 
        calculateFare(ticketForm.source, ticketForm.destination, passengerType) : 0
    };
    setTicketForm(newForm);
  };

  const handlePaymentMethodChange = (paymentMethod) => {
    setTicketForm({
      ...ticketForm,
      paymentMethod
    });
  };

  const initiateOnlinePayment = () => {
    if (!ticketForm.source || !ticketForm.destination) {
      Alert.alert('Error', 'Please select source and destination stops.');
      return;
    }

    if (ticketForm.fare <= 0) {
      Alert.alert('Error', 'Please select valid source and destination stops.');
      return;
    }

    // Navigate to payment screen
    navigation.navigate('Payment', {
      ticketData: {
        ...ticketForm,
        busNumber: currentBusData.BusNumber,
        serviceNO: currentBusData.serviceNO,
        busId: busData.busId,
        driverName: currentBusData.DriverName,
        route: `${currentBusData.Source} to ${currentBusData.destination}`
      },
      currentBusData
    });
  };

  const issueCashTicket = async () => {
    if (!ticketForm.source || !ticketForm.destination) {
      Alert.alert('Error', 'Please select source and destination stops.');
      return;
    }

    if (ticketForm.fare <= 0) {
      Alert.alert('Error', 'Please select valid source and destination stops.');
      return;
    }

    try {
      // Get current route-specific counts
      const routeKey = `${ticketForm.source}-${ticketForm.destination}`;
      const currentRouteCount = currentBusData.routeCounts?.[routeKey] || 0;
      const newRouteCount = currentRouteCount + 1;
      
      // Update total count
      const newTotalCount = (currentBusData.currentCount || 0) + 1;
      
      if (newTotalCount > currentBusData.capacity) {
        Alert.alert('Bus Full', 'Cannot issue ticket. Bus is at full capacity.');
        return;
      }

      // Update bus passenger counts
      await updateBusInFirebase({ 
        currentCount: newTotalCount,
        routeCounts: {
          ...currentBusData.routeCounts,
          [routeKey]: newRouteCount
        },
        lastTicketUpdate: Date.now()
      });

      // Create ticket record
      const ticketRef = push(ref(database, 'tickets'));
      const ticketData = {
        id: ticketRef.key,
        busId: busData.busId,
        busNumber: currentBusData.BusNumber,
        serviceNO: currentBusData.serviceNO,
        source: ticketForm.source,
        destination: ticketForm.destination,
        routeKey: routeKey,
        passengerType: ticketForm.passengerType,
        fare: ticketForm.fare,
        paymentMethod: 'cash',
        paymentStatus: 'completed',
        issuedAt: Date.now(),
        conductorId: busData.DriverName,
        route: `${currentBusData.Source} to ${currentBusData.destination}`,
        isCrowdCounted: true
      };

      await update(ticketRef, ticketData);

      // Reset form and close modal
      setTicketForm({
        source: '',
        destination: '',
        passengerType: 'adult',
        fare: 0,
        paymentMethod: 'cash'
      });
      setShowTicketForm(false);

      Alert.alert(
        'Ticket Issued ✅',
        `Bus: ${currentBusData.BusNumber}\nFrom: ${ticketData.source}\nTo: ${ticketData.destination}\nFare: ₹${ticketData.fare}\nPassenger: ${ticketData.passengerType}\nPayment: Cash\n\nRoute Passengers: ${newRouteCount}\nTotal Passengers: ${newTotalCount}/${currentBusData.capacity}`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error issuing ticket:', error);
      Alert.alert('Error', 'Failed to issue ticket. Please try again.');
    }
  };

  const resetPassengerCount = async () => {
    try {
      await updateBusInFirebase({ 
        currentCount: 0,
        routeCounts: {} // Clear all route counts
      });
      Alert.alert('Reset', 'All passenger counts reset to 0');
    } catch (error) {
      console.error('Error resetting passenger count:', error);
      Alert.alert('Error', 'Failed to reset passenger count.');
    }
  };

  const getRouteWiseCrowdInfo = () => {
    if (!currentBusData.routeCounts) return [];
    
    const routes = Object.entries(currentBusData.routeCounts)
      .map(([routeKey, count]) => {
        const [source, destination] = routeKey.split('-');
        const percentage = (count / currentBusData.capacity) * 100;
        
        let level, color;
        if (percentage >= 80) { level = '🔴 Crowded'; color = '#F44336'; }
        else if (percentage >= 60) { level = '🟡 Moderate'; color = '#FF9800'; }
        else if (percentage >= 40) { level = '🟢 Light'; color = '#4CAF50'; }
        else { level = '🟢 Empty'; color = '#4CAF50'; }
        
        return {
          routeKey,
          source,
          destination,
          count,
          level,
          color,
          percentage
        };
      })
      .sort((a, b) => b.count - a.count); // Sort by count descending
    
    return routes;
  };

  const getCrowdLevel = () => {
    const currentCount = currentBusData.currentCount || 0;
    const percentage = (currentCount / currentBusData.capacity) * 100;
    if (percentage >= 80) return { text: '🔴 Crowded', color: '#F44336' };
    if (percentage >= 60) return { text: '🟡 Moderate', color: '#FF9800' };
    if (percentage >= 40) return { text: '🟢 Light', color: '#4CAF50' };
    return { text: '🟢 Empty', color: '#4CAF50' };
  };

  const crowdInfo = getCrowdLevel();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Conductor Dashboard</Text>
      
      {/* Bus Information */}
      <View style={styles.busInfo}>
        <Text style={styles.busNumber}>🚌 {currentBusData.BusNumber}</Text>
        <Text style={styles.serviceNo}>Service: {currentBusData.serviceNO}</Text>
        <Text style={styles.route}>{currentBusData.Source} → {currentBusData.destination}</Text>
        <Text style={styles.driver}>Driver: {currentBusData.DriverName}</Text>
        
        <View style={styles.crowdInfo}>
          <Text style={styles.crowdCount}>
            👥 Total Passengers: {currentBusData.currentCount || 0}/{currentBusData.capacity}
          </Text>
          <Text style={[styles.crowdLevel, { color: crowdInfo.color }]}>
            {crowdInfo.text}
          </Text>
        </View>

        {/* Route-wise Crowd Counts */}
        {getRouteWiseCrowdInfo().length > 0 && (
          <View style={styles.routeCrowdContainer}>
            <Text style={styles.routeCrowdTitle}>Passengers by Route:</Text>
            {getRouteWiseCrowdInfo().slice(0, 3).map((route, index) => (
              <View key={route.routeKey} style={styles.routeCrowdItem}>
                <Text style={styles.routeCrowdText}>
                  {route.source} → {route.destination}
                </Text>
                <Text style={[styles.routeCrowdCount, { color: route.color }]}>
                  {route.count} {route.level}
                </Text>
              </View>
            ))}
            {getRouteWiseCrowdInfo().length > 3 && (
              <Text style={styles.moreRoutesText}>
                +{getRouteWiseCrowdInfo().length - 3} more routes...
              </Text>
            )}
          </View>
        )}

        <View style={styles.statusInfo}>
          <Text style={[styles.status, isSharing ? styles.statusActive : styles.statusInactive]}>
            {isSharing ? '🟢 LIVE TRACKING ACTIVE' : '🔴 TRACKING INACTIVE'}
          </Text>
        </View>
      </View>

      {/* Map View */}
      <MapView
        style={styles.map}
        region={
          location ? {
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          } : {
            latitude: 15.3000,
            longitude: 78.3000,
            latitudeDelta: 1.5,
            longitudeDelta: 1.5,
          }
        }
        showsUserLocation={true}
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={`${currentBusData.BusNumber} - ${currentBusData.DriverName}`}
            description={`${currentBusData.Source} to ${currentBusData.destination}`}
            pinColor="#2196F3"
          />
        )}
      </MapView>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Location Sharing Controls */}
        {!isSharing ? (
          <TouchableOpacity 
            style={[styles.button, styles.startButton]}
            onPress={startSharingLocation}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? '🔄 Starting...' : '📍 Start Live Tracking'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.button, styles.stopButton]}
            onPress={stopSharingLocation}
          >
            <Text style={styles.buttonText}>🛑 Stop Live Tracking</Text>
          </TouchableOpacity>
        )}
        
        {/* Ticket Controls */}
        <View style={styles.ticketControls}>
          <TouchableOpacity 
            style={[styles.button, styles.ticketButton]}
            onPress={() => setShowTicketForm(true)}
            disabled={!isSharing}
          >
            <Text style={styles.buttonText}>🎫 Issue Ticket</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.resetButton]}
            onPress={resetPassengerCount}
          >
            <Text style={styles.buttonText}>🔄 Reset Count</Text>
          </TouchableOpacity>
        </View>

        {/* Management Controls */}
        <View style={styles.managementControls}>
          <TouchableOpacity 
            style={[styles.button, styles.managementButton]}
            onPress={() => navigation.navigate('TicketManagement', { busData: currentBusData })}
          >
            <Text style={styles.buttonText}>📊 View Tickets</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation */}
        <TouchableOpacity 
          style={[styles.button, styles.backButton]}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>← Back to Home</Text>
        </TouchableOpacity>
      </View>

      {/* Ticket Form Modal */}
      <Modal
        visible={showTicketForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTicketForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Issue New Ticket</Text>
            
            <ScrollView style={styles.formContainer}>
              {/* Source Stop */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>From (Source):</Text>
                <ScrollView style={styles.pickerContainer} horizontal={true}>
                  {getStopNames().map((stop, index) => (
                    <TouchableOpacity
                      key={stop}
                      style={[
                        styles.stopButton,
                        ticketForm.source === stop && styles.stopButtonSelected
                      ]}
                      onPress={() => handleSourceChange(stop)}
                    >
                      <Text style={[
                        styles.stopButtonText,
                        ticketForm.source === stop && styles.stopButtonTextSelected
                      ]}>
                        {stop}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Destination Stop */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>To (Destination):</Text>
                <ScrollView style={styles.pickerContainer} horizontal={true}>
                  {getStopNames()
                    .filter(stop => stop !== ticketForm.source)
                    .map((stop, index) => (
                    <TouchableOpacity
                      key={stop}
                      style={[
                        styles.stopButton,
                        ticketForm.destination === stop && styles.stopButtonSelected
                      ]}
                      onPress={() => handleDestinationChange(stop)}
                    >
                      <Text style={[
                        styles.stopButtonText,
                        ticketForm.destination === stop && styles.stopButtonTextSelected
                      ]}>
                        {stop}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Passenger Type */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Passenger Type:</Text>
                <View style={styles.passengerTypeContainer}>
                  {['adult', 'child', 'senior'].map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.passengerButton,
                        ticketForm.passengerType === type && styles.passengerButtonSelected
                      ]}
                      onPress={() => handlePassengerTypeChange(type)}
                    >
                      <Text style={[
                        styles.passengerButtonText,
                        ticketForm.passengerType === type && styles.passengerButtonTextSelected
                      ]}>
                        {type === 'adult' ? '👨 Adult' : 
                         type === 'child' ? '👶 Child' : '👵 Senior'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Payment Method */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Payment Method:</Text>
                <View style={styles.paymentMethodContainer}>
                  <TouchableOpacity
                    style={[
                      styles.paymentButton,
                      ticketForm.paymentMethod === 'cash' && styles.paymentButtonSelected
                    ]}
                    onPress={() => handlePaymentMethodChange('cash')}
                  >
                    <Text style={[
                      styles.paymentButtonText,
                      ticketForm.paymentMethod === 'cash' && styles.paymentButtonTextSelected
                    ]}>
                      💵 Cash
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.paymentButton,
                      ticketForm.paymentMethod === 'online' && styles.paymentButtonSelected
                    ]}
                    onPress={() => handlePaymentMethodChange('online')}
                  >
                    <Text style={[
                      styles.paymentButtonText,
                      ticketForm.paymentMethod === 'online' && styles.paymentButtonTextSelected
                    ]}>
                      📱 Online
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Fare Display */}
              <View style={styles.fareDisplay}>
                <Text style={styles.fareLabel}>Fare:</Text>
                <Text style={styles.fareAmount}>₹{ticketForm.fare}</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowTicketForm(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                {ticketForm.paymentMethod === 'cash' ? (
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.issueButton]}
                    onPress={issueCashTicket}
                    disabled={!ticketForm.source || !ticketForm.destination || ticketForm.fare <= 0}
                  >
                    <Text style={styles.modalButtonText}>
                      Issue Cash Ticket ₹{ticketForm.fare}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.onlineButton]}
                    onPress={initiateOnlinePayment}
                    disabled={!ticketForm.source || !ticketForm.destination || ticketForm.fare <= 0}
                  >
                    <Text style={styles.modalButtonText}>
                      Pay Online ₹{ticketForm.fare}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 16,
    backgroundColor: '#2196F3',
    color: 'white',
  },
  busInfo: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  busNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  serviceNo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  route: {
    fontSize: 16,
    color: '#2196F3',
    marginBottom: 4,
    fontWeight: '600',
  },
  driver: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  crowdInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  crowdCount: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  crowdLevel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  routeCrowdContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  routeCrowdTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  routeCrowdItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  routeCrowdText: {
    fontSize: 12,
    color: '#666',
    flex: 2,
  },
  routeCrowdCount: {
    fontSize: 11,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  moreRoutesText: {
    fontSize: 11,
    color: '#2196F3',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  statusInfo: {
    marginTop: 4,
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 4,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: '#E8F5E8',
    color: '#4CAF50',
  },
  statusInactive: {
    backgroundColor: '#FFEBEE',
    color: '#F44336',
  },
  map: {
    flex: 1,
  },
  controls: {
    padding: 16,
    backgroundColor: 'white',
    gap: 10,
  },
  ticketControls: {
    flexDirection: 'row',
    gap: 10,
  },
  managementControls: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  ticketButton: {
    backgroundColor: '#FF9800',
    flex: 2,
  },
  resetButton: {
    backgroundColor: '#9E9E9E',
    flex: 1,
  },
  managementButton: {
    backgroundColor: '#9C27B0',
    flex: 1,
  },
  backButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  formContainer: {
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  pickerContainer: {
    flexDirection: 'row',
  },
  stopButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  stopButtonSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  stopButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  stopButtonTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  passengerTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  passengerButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  passengerButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  passengerButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  passengerButtonTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  paymentButtonSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  paymentButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  paymentButtonTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  fareDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 8,
    marginVertical: 10,
  },
  fareLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  fareAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#9E9E9E',
  },
  issueButton: {
    backgroundColor: '#4CAF50',
  },
  onlineButton: {
    backgroundColor: '#2196F3',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ConductorScreen;