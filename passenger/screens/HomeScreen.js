// screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { database } from '../firebase/config';
import { ref, onValue, off } from 'firebase/database';

const HomeScreen = ({ navigation }) => {
  const [buses, setBuses] = useState([]);
  const [showSearch, setShowSearch] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 17.3850,
    longitude: 78.4867,
    latitudeDelta: 8.0,
    longitudeDelta: 8.0,
  });
  
  // Search states
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const [searchSourceText, setSearchSourceText] = useState('');
  const [searchDestinationText, setSearchDestinationText] = useState('');
  const [loading, setLoading] = useState(true);

  // These will be populated from Firebase data
  const [availableSources, setAvailableSources] = useState([]);
  const [availableDestinations, setAvailableDestinations] = useState([]);

  // City coordinates
  const cityCoordinates = {
    'PRODDUTUR': { latitude: 14.7502, longitude: 78.5543 },
    'KURNOOL': { latitude: 15.8281, longitude: 78.0373 },
    'HYDERABAD': { latitude: 17.3850, longitude: 78.4867 },
    'TIRUPATHI': { latitude: 13.6288, longitude: 79.4192 },
    'SRIKAKULAM': { latitude: 18.2969, longitude: 83.8973 },
    'VIZIANAGARAM': { latitude: 18.1167, longitude: 83.4167 },
    'VISAKHAPATNAM': { latitude: 17.6868, longitude: 83.2185 },
    'TEKKALI': { latitude: 18.6123, longitude: 84.2345 },
    'PALASA': { latitude: 18.7890, longitude: 84.4567 },
    'PARLAKIMIDI': { latitude: 18.7833, longitude: 84.0833 },
    'ANAKAPALLI': { latitude: 17.6833, longitude: 83.0167 },
    'RAJAMAHENDRAVARAM': { latitude: 16.9833, longitude: 81.7833 },
  };

  // Load all data from Firebase
  useEffect(() => {
    const busesRef = ref(database, 'buses');
    setLoading(true);
    
    const unsubscribe = onValue(busesRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        const busesArray = [];
        const sourcesSet = new Set();
        const destinationsSet = new Set();

        // Process each bus
        Object.keys(data).forEach(key => {
          const bus = data[key];
          
          // Normalize bus data - handle field name variations
          const normalizedBus = {
            id: key,
            BusNumber: bus.BusNumber || bus.busNumber || 'N/A',
            Source: bus.Source || bus.source || 'Unknown',
            Destination: bus.Destination || bus.destination || 'Unknown',
            BusType: bus.BusType || bus.busType || 'Ordinary',
            DriverName: bus.DriverName || bus.driverName || 'Unknown',
            serviceNO: bus.serviceNO || bus.serviceNo || 'N/A',
            ScheduleDeparture: bus.ScheduleDeparture || bus.departure || 'N/A',
            ScheduleArrival: bus.ScheduleArrival || bus.arrival || 'N/A',
            STOPROUTES: bus.STOPROUTES || bus.route || '',
            currentCount: bus.currentCount || bus.passengers || 0,
            capacity: bus.capacity || 50,
            latitude: typeof bus.latitude === 'number' ? bus.latitude : 17.3850,
            longitude: typeof bus.longitude === 'number' ? bus.longitude : 78.4867,
            isActive: bus.isActive !== undefined ? bus.isActive : true,
          };

          busesArray.push(normalizedBus);

          // Add to sources and destinations
          if (normalizedBus.Source && normalizedBus.Source !== 'Unknown') {
            sourcesSet.add(normalizedBus.Source.toUpperCase().trim());
          }
          if (normalizedBus.Destination && normalizedBus.Destination !== 'Unknown') {
            destinationsSet.add(normalizedBus.Destination.toUpperCase().trim());
          }
        });

        setBuses(busesArray);
        
        // Convert sets to arrays and sort
        const sourcesArray = Array.from(sourcesSet).sort();
        const destinationsArray = Array.from(destinationsSet).sort();

        setAvailableSources(sourcesArray);
        setAvailableDestinations(destinationsArray);
      } else {
        setBuses([]);
        setAvailableSources([]);
        setAvailableDestinations([]);
      }
      setLoading(false);
    }, (error) => {
      setLoading(false);
      Alert.alert('Connection Error', 'Failed to connect to server');
    });

    return () => off(busesRef, 'value', unsubscribe);
  }, []);

  // SIMPLE AND RELIABLE SEARCH FUNCTION
  const filteredBuses = buses.filter(bus => {
    if (!source && !destination) return true;
    
    const busSource = (bus.Source || '').toUpperCase().trim();
    const busDestination = (bus.Destination || '').toUpperCase().trim();
    
    const searchSource = source.toUpperCase().trim();
    const searchDestination = destination.toUpperCase().trim();
    
    // Simple exact match for source and destination
    const hasSource = !source || busSource === searchSource;
    const hasDestination = !destination || busDestination === searchDestination;
    
    return hasSource && hasDestination;
  });

  // Active buses count
  const activeBusesCount = buses.filter(bus => bus.isActive).length;

  // Search handler
  const handleSearch = () => {
    if (!source && !destination) {
      Alert.alert('Error', 'Please select source and/or destination');
      return;
    }
    
    // Show immediate feedback
    if (filteredBuses.length === 0) {
      Alert.alert(
        'No Buses Found', 
        `No direct buses found for ${source} → ${destination}`,
        [{ text: 'OK' }]
      );
    }
    
    setShowSearch(false);
    setShowMap(false);
  };

  // Bus selection handler
  const handleBusSelect = (bus) => {
    setSelectedBus(bus);
    setShowMap(true);
    
    // Set map region based on bus source coordinates
    const sourceCoord = cityCoordinates[bus.Source?.toUpperCase()] || { latitude: 17.3850, longitude: 78.4867 };
    setMapRegion({
      latitude: sourceCoord.latitude,
      longitude: sourceCoord.longitude,
      latitudeDelta: 1.0,
      longitudeDelta: 1.0,
    });
  };

  // Dropdown handlers
  const handleSourceSelect = (selectedSource) => {
    setSource(selectedSource);
    setShowSourceDropdown(false);
    setSearchSourceText('');
  };

  const handleDestinationSelect = (selectedDestination) => {
    setDestination(selectedDestination);
    setShowDestinationDropdown(false);
    setSearchDestinationText('');
  };

  // Clear search
  const clearSearch = () => {
    setSource('');
    setDestination('');
    setSearchSourceText('');
    setSearchDestinationText('');
  };

  // Filtered dropdown items
  const filteredSources = availableSources.filter(item =>
    item.toLowerCase().includes(searchSourceText.toLowerCase())
  );

  const filteredDestinations = availableDestinations.filter(item =>
    item.toLowerCase().includes(searchDestinationText.toLowerCase())
  );

  // Dropdown component
  const renderDropdown = (items, visible, onSelect, onClose, value, searchText, onSearchChange, placeholder) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        onPress={onClose}
      >
        <View style={styles.dropdownContainer}>
          <Text style={styles.dropdownTitle}>Select Location</Text>
          
          <TextInput
            style={styles.dropdownSearchInput}
            placeholder={placeholder}
            value={searchText}
            onChangeText={onSearchChange}
            autoFocus={true}
          />
          
          <ScrollView style={styles.dropdownList}>
            {items.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dropdownItem,
                  value === item && styles.dropdownItemSelected
                ]}
                onPress={() => onSelect(item)}
              >
                <Text style={[
                  styles.dropdownItemText,
                  value === item && styles.dropdownItemTextSelected
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
            {items.length === 0 && (
              <Text style={styles.noResultsText}>No locations found</Text>
            )}
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.dropdownCloseButton}
            onPress={onClose}
          >
            <Text style={styles.dropdownCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading bus data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Bus Route Finder</Text>
      
      {showSearch ? (
        <View style={styles.searchContainer}>
          <View style={styles.connectionStatus}>
            <Text style={styles.connectionText}>
              {buses.length > 0 ? `✅ Connected - ${buses.length} buses available` : '🔴 No buses available'}
            </Text>
            <Text style={styles.dataInfo}>
              {availableSources.length} sources • {availableDestinations.length} destinations
            </Text>
          </View>

          <Text style={styles.searchTitle}>Find Your Bus</Text>
          
          {/* Source Dropdown */}
          <Text style={styles.sectionLabel}>From</Text>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowSourceDropdown(true)}
          >
            <Text style={source ? styles.dropdownButtonText : styles.dropdownButtonPlaceholder}>
              {source || 'Select departure location'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>

          {/* Destination Dropdown */}
          <Text style={styles.sectionLabel}>To</Text>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowDestinationDropdown(true)}
          >
            <Text style={destination ? styles.dropdownButtonText : styles.dropdownButtonPlaceholder}>
              {destination || 'Select arrival location'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.searchButton, (!source && !destination) && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={!source && !destination}
          >
            <Text style={styles.searchButtonText}>
              Search Buses
            </Text>
          </TouchableOpacity>

          {(source || destination) && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={clearSearch}
            >
              <Text style={styles.clearButtonText}>Clear Search</Text>
            </TouchableOpacity>
          )}

          {/* Source Dropdown Modal */}
          {renderDropdown(
            filteredSources,
            showSourceDropdown,
            handleSourceSelect,
            () => {
              setShowSourceDropdown(false);
              setSearchSourceText('');
            },
            source,
            searchSourceText,
            setSearchSourceText,
            "Search departure location..."
          )}

          {/* Destination Dropdown Modal */}
          {renderDropdown(
            filteredDestinations,
            showDestinationDropdown,
            handleDestinationSelect,
            () => {
              setShowDestinationDropdown(false);
              setSearchDestinationText('');
            },
            destination,
            searchDestinationText,
            setSearchDestinationText,
            "Search arrival location..."
          )}
        </View>
      ) : showMap ? (
        <View style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setShowMap(false)}
            >
              <Text style={styles.backButtonText}>← Back to List</Text>
            </TouchableOpacity>
            <Text style={styles.mapTitle}>
              {selectedBus ? `${selectedBus.BusNumber} - ${selectedBus.Source} → ${selectedBus.Destination}` : 'Bus Map'}
            </Text>
            <View style={{ width: 60 }} />
          </View>
          
          <MapView
            style={styles.map}
            region={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {/* Live Bus Marker */}
            {selectedBus && (
              <Marker
                coordinate={{
                  latitude: selectedBus.latitude,
                  longitude: selectedBus.longitude,
                }}
                title={`Bus ${selectedBus.BusNumber}`}
                description={`${selectedBus.Source} → ${selectedBus.Destination}`}
                pinColor="#0000FF"
              />
            )}
          </MapView>

          {selectedBus && (
            <View style={styles.busDetailsPanel}>
              <Text style={styles.panelTitle}>Bus Details</Text>
              
              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Bus Number:</Text>
                  <Text style={styles.detailValue}>{selectedBus.BusNumber}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Service:</Text>
                  <Text style={styles.detailValue}>{selectedBus.serviceNO}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>{selectedBus.BusType}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Driver:</Text>
                  <Text style={styles.detailValue}>{selectedBus.DriverName}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Passengers:</Text>
                  <Text style={styles.detailValue}>
                    {selectedBus.currentCount}/{selectedBus.capacity}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Timing:</Text>
                  <Text style={styles.detailValue}>
                    {selectedBus.ScheduleDeparture} - {selectedBus.ScheduleArrival}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={[
                    styles.detailValue,
                    selectedBus.isActive ? styles.statusActive : styles.statusInactive
                  ]}>
                    {selectedBus.isActive ? 'Active • LIVE' : 'Offline'}
                  </Text>
                </View>
              </View>

              {/* Route Stops Section */}
              <Text style={styles.routeStopsTitle}>Route</Text>
              <ScrollView style={styles.routeStopsList}>
                <Text style={styles.routeText}>
                  {selectedBus.STOPROUTES || 'Route information not available'}
                </Text>
              </ScrollView>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.homeButton}
            onPress={() => {
              setShowMap(false);
              setShowSearch(true);
              setSelectedBus(null);
            }}
          >
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              Found {filteredBuses.length} buses for {source} → {destination}
            </Text>
            <TouchableOpacity 
              style={styles.backSearchButton}
              onPress={() => setShowSearch(true)}
            >
              <Text style={styles.backSearchText}>New Search</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.busList}>
            {filteredBuses.length > 0 ? (
              filteredBuses.map((bus, index) => (
                <TouchableOpacity
                  key={bus.id}
                  style={[
                    styles.busItem,
                    bus.isActive && styles.activeBusItem
                  ]}
                  onPress={() => handleBusSelect(bus)}
                >
                  <View style={styles.busHeader}>
                    <Text style={styles.busNumber}>{bus.BusNumber}</Text>
                    {bus.isActive && (
                      <Text style={styles.liveBadge}>● LIVE</Text>
                    )}
                  </View>
                  
                  <Text style={styles.route}>{bus.Source} → {bus.Destination}</Text>
                  
                  <View style={styles.timingContainer}>
                    <Text style={styles.timing}>
                      {bus.ScheduleDeparture} - {bus.ScheduleArrival}
                    </Text>
                  </View>
                  
                  <View style={styles.passengerInfo}>
                    <Text style={styles.passengerCount}>
                      {bus.currentCount}/{bus.capacity} passengers
                    </Text>
                    <Text style={styles.driverName}>
                      Driver: {bus.DriverName}
                    </Text>
                  </View>
                  
                  <View style={styles.statusContainer}>
                    <Text style={
                      bus.isActive ? styles.liveStatus : styles.offlineStatus
                    }>
                      {bus.isActive ? '● Active - Real-time tracking' : '● Offline - Not tracking'}
                    </Text>
                  </View>

                  {/* Route Stops Preview */}
                  <View style={styles.routeStopsPreview}>
                    <Text style={styles.routeStopsPreviewText}>
                      Route: {bus.STOPROUTES || 'No route information'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noBuses}>
                <Text style={styles.noBusesText}>No buses found</Text>
                <Text style={styles.noBusesSubtext}>
                  No direct buses available for {source} → {destination}
                </Text>
                <TouchableOpacity 
                  style={styles.tryAgainButton}
                  onPress={() => setShowSearch(true)}
                >
                  <Text style={styles.tryAgainText}>Search Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

// ... KEEP ALL THE SAME STYLES FROM PREVIOUS CODE ...
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
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 16,
    backgroundColor: '#2196F3',
    color: 'white',
  },
  connectionStatus: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  connectionText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '500',
    textAlign: 'center',
  },
  dataInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
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
    marginBottom: 30,
    color: '#333',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    marginTop: 15,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownButtonPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  searchButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 20,
  },
  searchButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    padding: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  dropdownContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    textAlign: 'center',
  },
  dropdownSearchInput: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    fontSize: 16,
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownItemTextSelected: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  noResultsText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
    fontSize: 16,
  },
  dropdownCloseButton: {
    padding: 15,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  dropdownCloseText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  resultsHeader: {
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  backSearchButton: {
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 8,
    marginTop: 10,
  },
  backSearchText: {
    color: 'white',
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
  },
  activeBusItem: {
    borderLeftColor: '#4CAF50',
    backgroundColor: '#f8fff8',
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  busNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  liveBadge: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: 'bold',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  route: {
    fontSize: 14,
    color: '#666',
    marginBottom: 0,
    fontWeight: '500',
  },
  timingContainer: {
    marginBottom: 8,
  },
  timing: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  passengerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  passengerCount: {
    fontSize: 13,
    color: '#666',
  },
  driverName: {
    fontSize: 13,
    color: '#666',
  },
  statusContainer: {
    marginBottom: 8,
  },
  liveStatus: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  offlineStatus: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '500',
  },
  routeStopsPreview: {

    paddingTop: 10,
    borderTopWidth: 0,
    borderTopColor: '#f0f0f0',
  },
  routeStopsPreviewText: {
    fontSize: 11,
    color: '#070707ff',
    fontStyle: 'italic',
  },
  routeText: {
    fontSize: 14,
    color: '#0a0a0aff',

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
  mapContainer: {
    flex: 1,
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
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  map: {
    flex: 1,
  },
  busDetailsPanel: {
    backgroundColor: 'white',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    maxHeight: 300,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  detailItem: {
    width: '48%',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  statusActive: {
    color: '#4CAF50',
  },
  statusInactive: {
    color: '#F44336',
  },
  routeStopsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginTop: 10,
  },
  routeStopsList: {
    maxHeight: 120,
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
});

export default HomeScreen;