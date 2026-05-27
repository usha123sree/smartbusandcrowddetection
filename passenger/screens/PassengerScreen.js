// screens/PassengerScreen.js - COMPLETE CODE WITH FIREBASE TEST
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity, 
  TextInput,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { database } from '../firebase/config';
import { ref, onValue, off } from 'firebase/database';

const PassengerScreen = ({ navigation }) => {
  const [allBuses, setAllBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [mapRegion, setMapRegion] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  const [showSearch, setShowSearch] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [showSourceSuggestions, setShowSourceSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [availableStops, setAvailableStops] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [firebaseData, setFirebaseData] = useState(null);
  const mapRef = useRef(null);

  // 🔥 FIREBASE TEST FUNCTION
  const testFirebaseConnection = () => {
    console.log('🔥 FIREBASE TEST - Starting connection test...');
    const testRef = ref(database, 'buses');
    
    const testUnsubscribe = onValue(testRef, (snapshot) => {
      const data = snapshot.val();
      console.log('🔥 FIREBASE TEST - Raw data received:', data);
      
      if (data) {
        console.log('🔥 FIREBASE TEST - Number of buses:', Object.keys(data).length);
        
        // Log each bus and its location data
        Object.keys(data).forEach(busId => {
          const bus = data[busId];
          console.log(`🔥 FIREBASE TEST - Bus ${bus.BusNumber}:`, {
            isActive: bus.isActive,
            location: bus.location,
            hasLocation: !!bus.location,
            locationType: bus.location ? typeof bus.location : 'none',
            locationFormat: bus.location ? 
              `lat: ${bus.location.lat}, lng: ${bus.location.lng}` : 
              'No location'
          });
        });
      } else {
        console.log('🔥 FIREBASE TEST - No data found in Firebase');
      }
    }, (error) => {
      console.error('🔥 FIREBASE TEST - Connection error:', error);
    });

    // Cleanup after 10 seconds
    setTimeout(() => {
      console.log('🔥 FIREBASE TEST - Cleaning up test listener');
      off(testRef, 'value', testUnsubscribe);
    }, 10000);
  };

  // Enhanced coordinate mapping for stops
  const stopCoordinates = {
    'KURNOOL': { latitude: 15.8281, longitude: 78.0373 },
    'ORVAKAL': { latitude: 15.7500, longitude: 78.1000 },
    'BETHAMCHERLA': { latitude: 15.7833, longitude: 78.1500 },
    'BANAGANAPALLY': { latitude: 15.3167, longitude: 78.2333 },
    'KOILAKUNTLA': { latitude: 15.2333, longitude: 78.3167 },
    'JAMMALAMADUGU': { latitude: 15.0667, longitude: 78.3833 },
    'PRODDUTUR': { latitude: 14.7500, longitude: 78.5500 },
    'DEVAGUDI': { latitude: 14.7000, longitude: 78.6000 },
    'GUNDLAKUNTA': { latitude: 14.8000, longitude: 78.5000 },
    'NOSSAM': { latitude: 14.9000, longitude: 78.4500 },
    'MAYALURU': { latitude: 15.0000, longitude: 78.4000 }
  };

  // Initialize with default region
  useEffect(() => {
    setMapRegion({
      latitude: 15.3000,
      longitude: 78.3000,
      latitudeDelta: 1.5,
      longitudeDelta: 1.5,
    });
    
    // 🔥 CALL FIREBASE TEST ON MOUNT
    testFirebaseConnection();
  }, []);

  useEffect(() => {
    console.log('🚌 PassengerScreen mounted - Connecting to Firebase...');
    setLoading(true);
    
    const busesRef = ref(database, 'buses');
    
    const unsubscribe = onValue(busesRef, (snapshot) => {
      try {
        setIsConnected(true);
        setLoading(false);
        const busesData = snapshot.val();
        setFirebaseData(busesData);
        console.log('📡 Firebase RAW data received:', busesData);
        
        if (busesData) {
          const busesArray = Object.keys(busesData).map(key => {
            const bus = busesData[key];
            
            console.log(`📍 Processing bus ${bus.BusNumber}:`, bus.location);
            
            // FIXED: Enhanced location detection
            let location = null;
            if (bus.location) {
              // Handle both {lat, lng} and {latitude, longitude} formats
              if (bus.location.lat !== undefined && bus.location.lng !== undefined) {
                location = {
                  latitude: parseFloat(bus.location.lat),
                  longitude: parseFloat(bus.location.lng)
                };
              } else if (bus.location.latitude !== undefined && bus.location.longitude !== undefined) {
                location = {
                  latitude: parseFloat(bus.location.latitude),
                  longitude: parseFloat(bus.location.longitude)
                };
              }
            }
            
            const processedBus = {
              id: key,
              ...bus,
              // Ensure consistent field names
              Source: bus.Source || bus.source || 'Unknown',
              destination: bus.destination || bus.Destination || 'Unknown',
              BusNumber: bus.BusNumber || bus.busNumber || 'N/A',
              BusType: bus.BusType || bus.busType || 'Regular',
              serviceNO: bus.serviceNO || bus.serviceNo || 'N/A',
              DriverName: bus.DriverName || bus.driverName || 'Unknown',
              STOPROUTES: bus.STOPROUTES || bus.stopRoutes || '',
              ScheduleDeparture: bus.ScheduleDeparture || bus.departure || '',
              ScheduleArrival: bus.ScheduleArrival || bus.arrival || '',
              capacity: bus.capacity || 50,
              currentCount: bus.currentCount || 0,
              // Enhanced location handling
              location: location,
              isActive: Boolean(bus.isActive),
              lastUpdated: bus.lastUpdated || null
            };
            
            console.log(`✅ Processed bus ${processedBus.BusNumber}:`, {
              isActive: processedBus.isActive,
              location: processedBus.location,
              hasLocation: !!processedBus.location
            });
            
            return processedBus;
          });
          
          setAllBuses(busesArray);
          
          // Extract unique stops from all buses
          const stops = extractUniqueStops(busesArray);
          setAvailableStops(stops);

          // Debug: Count active buses with location
          const activeBuses = busesArray.filter(bus => bus.isActive && bus.location);
          console.log(`📊 Total: ${busesArray.length} buses, Active with location: ${activeBuses.length}`);
          
          if (activeBuses.length > 0) {
            activeBuses.forEach(bus => {
              console.log(`   🟢 ${bus.BusNumber}: ${bus.location.latitude}, ${bus.location.longitude}`);
            });
          } else {
            console.log('   🔴 No active buses with location data found');
          }
        } else {
          setAllBuses([]);
          setAvailableStops([]);
          console.log('ℹ️ No bus data found in Firebase');
        }
      } catch (error) {
        console.error('❌ Error processing bus data:', error);
        setIsConnected(false);
        setLoading(false);
      }
    }, (error) => {
      console.error('❌ Firebase connection error:', error);
      setIsConnected(false);
      setLoading(false);
      Alert.alert('Connection Error', 'Failed to connect to server. Please check your internet connection.');
    });

    return () => {
      console.log('🚌 PassengerScreen unmounted - Removing Firebase listener');
      off(busesRef, 'value', unsubscribe);
    };
  }, []);

  // Real-time refresh for selected bus
  useEffect(() => {
    let interval;
    if (selectedBus) {
      interval = setInterval(() => {
        setRefreshKey(prev => prev + 1);
      }, 3000); // Update every 3 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedBus]);

  // Debug component to show Firebase status
  const renderDebugInfo = () => {
    if (!__DEV__) return null;
    
    const activeBuses = allBuses.filter(bus => bus.isActive && bus.location);
    
    return (
      <View style={styles.debugPanel}>
        <Text style={styles.debugText}>
          🔗 Firebase: {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
        </Text>
        <Text style={styles.debugText}>
          📊 Total Buses: {allBuses.length} | Active: {activeBuses.length}
        </Text>
        <Text style={styles.debugText}>
          🔍 Selected: {selectedBus?.BusNumber || 'None'}
        </Text>
        {selectedBus && (
          <Text style={styles.debugText}>
            📍 Location: {selectedBus.location ? 
              `${selectedBus.location.latitude?.toFixed(4)}, ${selectedBus.location.longitude?.toFixed(4)}` : 
              'No location'}
          </Text>
        )}
        {activeBuses.slice(0, 3).map(bus => (
          <Text key={bus.id} style={styles.debugText}>
            🚌 {bus.BusNumber}: {bus.location.latitude?.toFixed(4)}, {bus.location.longitude?.toFixed(4)}
          </Text>
        ))}
      </View>
    );
  };

  const extractUniqueStops = (buses) => {
    const stops = new Set();
    buses.forEach(bus => {
      if (bus.STOPROUTES) {
        const routeStops = bus.STOPROUTES.split('-').map(stop => stop.trim());
        routeStops.forEach(stop => {
          if (stop) stops.add(stop);
        });
      }
    });
    return Array.from(stops).sort();
  };

  const getDefaultRegion = (buses) => {
    if (buses.length === 0) {
      return {
        latitude: 15.3000,
        longitude: 78.3000,
        latitudeDelta: 1.5,
        longitudeDelta: 1.5,
      };
    }

    // Try to find a bus with location data
    const busWithLocation = buses.find(bus => bus.location && bus.location.latitude && bus.location.longitude);
    if (busWithLocation && busWithLocation.location) {
      return {
        latitude: busWithLocation.location.latitude,
        longitude: busWithLocation.location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    return {
      latitude: 15.3000,
      longitude: 78.3000,
      latitudeDelta: 1.5,
      longitudeDelta: 1.5,
    };
  };

  const generateRouteCoordinates = (stopRoutes) => {
    if (!stopRoutes) return [];
    
    const stops = stopRoutes.split('-').map(stop => stop.trim());
    const coordinates = [];
    
    stops.forEach(stop => {
      const stopUpper = stop.toUpperCase();
      if (stopCoordinates[stopUpper]) {
        coordinates.push({
          ...stopCoordinates[stopUpper],
          name: stop
        });
      }
    });
    
    return coordinates;
  };

  const getCrowdLevel = (bus) => {
    const currentCount = bus.currentCount || 0;
    const capacity = bus.capacity || 1;
    const percentage = (currentCount / capacity) * 100;
    
    if (percentage >= 80) return { text: '🔴 Crowded', color: '#F44336' };
    if (percentage >= 60) return { text: '🟡 Moderate', color: '#FF9800' };
    if (percentage >= 40) return { text: '🟢 Light', color: '#4CAF50' };
    return { text: '🟢 Empty', color: '#4CAF50' };
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString.length > 8 ? timeString.substring(0, 5) : timeString;
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const searchBuses = () => {
    if (!source || !destination) {
      Alert.alert('Error', 'Please select both source and destination stops.');
      return;
    }

    if (source === destination) {
      Alert.alert('Error', 'Source and destination cannot be the same.');
      return;
    }

    const filtered = allBuses.filter(bus => {
      if (!bus.STOPROUTES) return false;
      
      const stops = bus.STOPROUTES.split('-').map(stop => stop.trim());
      const sourceIndex = stops.findIndex(stop => 
        stop.toLowerCase().includes(source.toLowerCase())
      );
      const destIndex = stops.findIndex(stop => 
        stop.toLowerCase().includes(destination.toLowerCase())
      );
      
      return sourceIndex !== -1 && destIndex !== -1 && sourceIndex < destIndex;
    });

    setFilteredBuses(filtered);
    setShowSearch(false);
    
    if (filtered.length === 0) {
      Alert.alert('No Buses Found', `No buses found for route: ${source} → ${destination}. Try different stops.`);
    }
  };

  const resetSearch = () => {
    setSource('');
    setDestination('');
    setShowSearch(true);
    setShowMap(false);
    setSelectedBus(null);
  };

  // Enhanced bus selection
  const handleBusSelect = (bus) => {
    console.log('📍 Selecting bus:', {
      number: bus.BusNumber,
      isActive: bus.isActive,
      location: bus.location,
      hasLocation: !!bus.location
    });
    
    setSelectedBus(bus);
    setShowMap(true);
    
    // Set initial map region
    let initialRegion;
    
    if (bus.isActive && bus.location) {
      // Use live bus location
      initialRegion = {
        latitude: bus.location.latitude,
        longitude: bus.location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      console.log('🗺️ Using LIVE location for map');
    } else {
      // Use default region
      initialRegion = {
        latitude: 15.3000,
        longitude: 78.3000,
        latitudeDelta: 1.5,
        longitudeDelta: 1.5,
      };
      console.log('🗺️ Using DEFAULT region for map');
    }
    
    setMapRegion(initialRegion);
    
    // Fit map after delay
    setTimeout(() => {
      if (mapRef.current && bus.location) {
        mapRef.current.animateToRegion({
          latitude: bus.location.latitude,
          longitude: bus.location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
    }, 1000);
  };

  // Enhanced bus item rendering with live location status
  const renderBusItem = (bus) => {
    const crowdInfo = getCrowdLevel(bus);
    const isLive = bus.isActive && bus.location && bus.location.latitude && bus.location.longitude;
    const locationAge = bus.lastUpdated ? Date.now() - bus.lastUpdated : null;
    const isLocationFresh = locationAge && locationAge < 300000; // 5 minutes
    
    return (
      <TouchableOpacity 
        key={bus.id} 
        style={[
          styles.busItem,
          isLive && styles.activeBusItem
        ]}
        onPress={() => handleBusSelect(bus)}
      >
        <View style={styles.busHeader}>
          <View style={styles.busIdentity}>
            <Text style={styles.busNumber}>🚌 {bus.BusNumber}</Text>
            {isLive && (
              <View style={styles.liveIndicator}>
                <Text style={styles.liveBadge}>
                  {isLocationFresh ? '🔴 LIVE' : '🟡 STALE'}
                </Text>
                <Text style={styles.locationAge}>
                  {locationAge ? `${Math.round(locationAge / 1000)}s ago` : 'Just now'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.busType}>{bus.BusType}</Text>
        </View>
        
        <Text style={styles.route}>
          {bus.Source} → {bus.destination}
        </Text>
        
        <View style={styles.timingContainer}>
          <Text style={styles.timing}>
            🕒 {formatTime(bus.ScheduleDeparture)} - {formatTime(bus.ScheduleArrival)}
          </Text>
        </View>
        
        <View style={styles.detailsRow}>
          <Text style={styles.busDetails}>
            👥 {bus.currentCount || 0}/{bus.capacity || '?'} passengers
          </Text>
          <Text style={[styles.crowdLevel, { color: crowdInfo.color }]}>
            {crowdInfo.text}
          </Text>
        </View>
        
        <Text style={styles.driver}>
          Driver: {bus.DriverName}
        </Text>
        
        {isLive ? (
          <View style={styles.liveStatusContainer}>
            <Text style={styles.liveStatus}>
              🔴 Live tracking active • Tap to view real-time location
            </Text>
            {bus.location && (
              <Text style={styles.coordinates}>
                Lat: {bus.location.latitude.toFixed(4)}, Lon: {bus.location.longitude.toFixed(4)}
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.offlineStatus}>
            🔴 Offline - Not tracking
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // Enhanced map rendering with better error handling
  const renderMapWithLiveLocation = () => {
    if (!selectedBus) {
      console.log('🗺️ No selected bus for map');
      return null;
    }

    const isLive = selectedBus.isActive && selectedBus.location;
    
    console.log('🗺️ Rendering map:', {
      bus: selectedBus.BusNumber,
      isLive: isLive,
      location: selectedBus.location
    });

    return (
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={mapRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          onRegionChangeComplete={(region) => setMapRegion(region)}
          key={refreshKey}
        >
          {/* Real-time Bus Marker - RED MARKER */}
          {isLive && selectedBus.location && (
            <Marker
              coordinate={{
                latitude: selectedBus.location.latitude,
                longitude: selectedBus.location.longitude,
              }}
              title={`${selectedBus.BusNumber} - Live Location`}
              description={`Driver: ${selectedBus.DriverName}\n${selectedBus.Source} → ${selectedBus.destination}`}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.redBusMarker}>
                <Text style={styles.redBusMarkerText}>🚌</Text>
                <View style={styles.redPulseEffect} />
              </View>
            </Marker>
          )}

          {/* Fallback marker if no live location */}
          {!isLive && (
            <Marker
              coordinate={{
                latitude: 15.3000,
                longitude: 78.3000,
              }}
              title={`${selectedBus.BusNumber} - Route Information`}
              description="Live location not available"
              pinColor="#666"
            />
          )}
        </MapView>

        {/* Status overlay */}
        <View style={styles.mapStatusOverlay}>
          <Text style={styles.mapStatusText}>
            {isLive ? '🔴 LIVE TRACKING ACTIVE' : '⚫ OFFLINE - SCHEDULE ONLY'}
          </Text>
          {isLive && selectedBus.location && (
            <Text style={styles.mapCoordinates}>
              📍 {selectedBus.location.latitude.toFixed(6)}, {selectedBus.location.longitude.toFixed(6)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  // Enhanced bus details panel
  const renderBusDetailsPanel = () => {
    if (!selectedBus) return null;

    const isLive = selectedBus.isActive && selectedBus.location;
    const locationAge = selectedBus.lastUpdated ? Date.now() - selectedBus.lastUpdated : null;

    return (
      <View style={styles.busDetailsPanel}>
        <Text style={styles.panelTitle}>Bus Details</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Bus Number:</Text>
          <Text style={styles.detailValue}>{selectedBus.BusNumber}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Service:</Text>
          <Text style={styles.detailValue}>{selectedBus.serviceNO}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Driver:</Text>
          <Text style={styles.detailValue}>{selectedBus.DriverName}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type:</Text>
          <Text style={styles.detailValue}>{selectedBus.BusType}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Passengers:</Text>
          <Text style={styles.detailValue}>{selectedBus.currentCount || 0}/{selectedBus.capacity || '?'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Timing:</Text>
          <Text style={styles.detailValue}>
            {selectedBus.ScheduleDeparture?.substring(0, 5) || 'N/A'} - {selectedBus.ScheduleArrival?.substring(0, 5) || 'N/A'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status:</Text>
          <Text style={[
            styles.detailValue, 
            isLive ? styles.statusActive : styles.statusInactive
          ]}>
            {isLive ? '🔴 LIVE TRACKING' : '⚫ OFFLINE'}
          </Text>
        </View>

        {/* Location information */}
        {isLive && selectedBus.location && (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Live Location:</Text>
              <Text style={styles.detailValue}>
                {selectedBus.location.latitude.toFixed(6)}, {selectedBus.location.longitude.toFixed(6)}
              </Text>
            </View>
            {selectedBus.lastUpdated && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Updated:</Text>
                <Text style={styles.detailValue}>
                  {locationAge ? `${Math.round(locationAge / 1000)}s ago` : 'Just now'}
                </Text>
              </View>
            )}
          </>
        )}
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Route:</Text>
          <Text style={styles.detailValue}>
            {selectedBus.STOPROUTES?.replace(/-/g, ' → ') || 'Not available'}
          </Text>
        </View>
      </View>
    );
  };

  const filteredSourceSuggestions = availableStops.filter(stop =>
    stop.toLowerCase().includes(source.toLowerCase())
  );

  const filteredDestinationSuggestions = availableStops.filter(stop =>
    stop.toLowerCase().includes(destination.toLowerCase()) && stop !== source
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Connecting to server...</Text>
        <Text style={styles.loadingSubtext}>Loading bus information</Text>
        
        {/* Test Button in Loading State */}
        {__DEV__ && (
          <TouchableOpacity 
            style={styles.testButton}
            onPress={testFirebaseConnection}
          >
            <Text style={styles.testButtonText}>🔥 Test Firebase Connection</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Bus Route Finder</Text>
      
      {/* Temporary Test Button */}
      {__DEV__ && (
        <TouchableOpacity 
          style={styles.testButton}
          onPress={testFirebaseConnection}
        >
          <Text style={styles.testButtonText}>🔥 Test Firebase Connection</Text>
        </TouchableOpacity>
      )}
      
      {/* Connection Status */}
      <View style={[styles.statusBar, !isConnected && styles.statusBarError]}>
        <Text style={styles.statusText}>
          {isConnected ? `🟢 Connected - ${allBuses.length} buses available` : '🔴 Connecting to server...'}
        </Text>
        {isConnected && (
          <Text style={styles.stopsInfo}>
            {allBuses.filter(bus => bus.isActive && bus.location).length} buses live tracking
          </Text>
        )}
      </View>

      {/* Debug Info */}
      {renderDebugInfo()}

      {/* Search Interface */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Text style={styles.searchTitle}>Find Your Bus</Text>
          
          {/* Source Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter source stop..."
              value={source}
              onChangeText={setSource}
              onFocus={() => setShowSourceSuggestions(true)}
            />
          </View>

          {/* Destination Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter destination stop..."
              value={destination}
              onChangeText={setDestination}
              onFocus={() => setShowDestinationSuggestions(true)}
            />
          </View>

          {/* Search Button */}
          <TouchableOpacity
            style={[styles.searchButton, (!source || !destination) && styles.searchButtonDisabled]}
            onPress={searchBuses}
            disabled={!source || !destination}
          >
            <Text style={styles.searchButtonText}>
              🔍 Search Buses
            </Text>
          </TouchableOpacity>

          {/* Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Tips:</Text>
            <Text style={styles.tipText}>• Look for 🔴 LIVE buses for real-time tracking</Text>
            <Text style={styles.tipText}>• Tap any bus to see its route and live location</Text>
            <Text style={styles.tipText}>• Buses update location every 5 seconds</Text>
          </View>
        </View>
      )}

      {/* Source Suggestions Modal */}
      <Modal
        visible={showSourceSuggestions}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSourceSuggestions(false)}
      >
        <View style={styles.suggestionsModal}>
          <View style={styles.suggestionsContainer}>
            <View style={styles.suggestionsHeader}>
              <Text style={styles.suggestionsTitle}>Select Source Stop</Text>
              <TouchableOpacity onPress={() => setShowSourceSuggestions(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={filteredSourceSuggestions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => {
                    setSource(item);
                    setShowSourceSuggestions(false);
                  }}
                >
                  <Text style={styles.suggestionItemText}>{item}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.noSuggestions}>
                  <Text style={styles.noSuggestionsText}>No stops found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Destination Suggestions Modal */}
      <Modal
        visible={showDestinationSuggestions}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDestinationSuggestions(false)}
      >
        <View style={styles.suggestionsModal}>
          <View style={styles.suggestionsContainer}>
            <View style={styles.suggestionsHeader}>
              <Text style={styles.suggestionsTitle}>Select Destination Stop</Text>
              <TouchableOpacity onPress={() => setShowDestinationSuggestions(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={filteredDestinationSuggestions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => {
                    setDestination(item);
                    setShowDestinationSuggestions(false);
                  }}
                >
                  <Text style={styles.suggestionItemText}>{item}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.noSuggestions}>
                  <Text style={styles.noSuggestionsText}>No stops found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Bus List Results */}
      {!showSearch && !showMap && (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              Found {filteredBuses.length} buses for {source} → {destination}
            </Text>
            <TouchableOpacity onPress={resetSearch} style={styles.backSearchButton}>
              <Text style={styles.backSearchText}>← New Search</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.busList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {filteredBuses.length === 0 ? (
              <View style={styles.noBuses}>
                <Text style={styles.noBusesText}>No buses found</Text>
                <Text style={styles.noBusesSubtext}>
                  Try different source or destination stops
                </Text>
                <TouchableOpacity style={styles.tryAgainButton} onPress={resetSearch}>
                  <Text style={styles.tryAgainText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredBuses.map(renderBusItem)
            )}
          </ScrollView>
        </View>
      )}

      {/* Map View */}
      {showMap && selectedBus && (
        <View style={styles.mapPageContainer}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>
              {selectedBus.BusNumber} - {selectedBus.Source} → {selectedBus.destination}
            </Text>
            <TouchableOpacity 
              onPress={() => setShowMap(false)} 
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Back to List</Text>
            </TouchableOpacity>
          </View>

          {renderMapWithLiveLocation()}
          {renderBusDetailsPanel()}

          <TouchableOpacity 
            style={styles.homeButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.homeButtonText}>← Back to Home</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#333',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 16,
    backgroundColor: '#4CAF50',
    color: 'white',
  },
  testButton: {
    backgroundColor: '#FF6B35',
    padding: 10,
    margin: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  statusBar: {
    backgroundColor: '#e8f5e8',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#c8e6c9',
  },
  statusBarError: {
    backgroundColor: '#ffebee',
    borderBottomColor: '#ffcdd2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  stopsInfo: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
    marginTop: 2,
  },
  debugPanel: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    margin: 10,
    borderRadius: 5,
  },
  debugText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'monospace',
    lineHeight: 14,
  },
  searchContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  searchButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  suggestionsModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  suggestionsContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 20,
    color: '#666',
    padding: 4,
  },
  suggestionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionItemText: {
    fontSize: 16,
    color: '#333',
  },
  noSuggestions: {
    padding: 20,
    alignItems: 'center',
  },
  noSuggestionsText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  tipsContainer: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976d2',
  },
  tipText: {
    fontSize: 12,
    color: '#1976d2',
    marginBottom: 4,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  backSearchButton: {
    padding: 8,
  },
  backSearchText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  busList: {
    flex: 1,
    padding: 10,
  },
  busItem: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeBusItem: {
    borderLeftColor: '#F44336',
    backgroundColor: '#fff5f5',
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  busIdentity: {
    flex: 1,
  },
  busNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  liveIndicator: {
    alignItems: 'flex-start',
  },
  liveBadge: {
    fontSize: 10,
    color: '#F44336',
    fontWeight: 'bold',
    marginTop: 2,
  },
  locationAge: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
  busType: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  route: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  timingContainer: {
    marginBottom: 5,
  },
  timing: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  busDetails: {
    fontSize: 12,
    color: '#888',
  },
  crowdLevel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  driver: {
    fontSize: 11,
    color: '#999',
    marginBottom: 5,
  },
  liveStatusContainer: {
    marginTop: 5,
  },
  liveStatus: {
    fontSize: 11,
    color: '#F44336',
    fontWeight: 'bold',
  },
  coordinates: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  offlineStatus: {
    fontSize: 11,
    color: '#F44336',
  },
  noBuses: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noBusesText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  noBusesSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  tryAgainButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tryAgainText: {
    color: 'white',
    fontWeight: 'bold',
  },
  mapPageContainer: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapStatusOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  mapStatusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  mapCoordinates: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  busDetailsPanel: {
    backgroundColor: 'white',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  statusActive: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  statusInactive: {
    color: '#666',
    fontWeight: 'bold',
  },
  homeButton: {
    backgroundColor: '#666',
    padding: 15,
    alignItems: 'center',
  },
  homeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Red bus marker styles
  redBusMarker: {
    backgroundColor: '#F44336',
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redBusMarkerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  redPulseEffect: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#F44336',
    opacity: 0.6,
  },
});

export default PassengerScreen;