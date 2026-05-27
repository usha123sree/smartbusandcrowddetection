// screens/BusDetailsScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, ActivityIndicator } from 'react-native';
import { database } from '../firebase/config';
import { ref, onValue, off } from 'firebase/database';

const BusDetailsScreen = ({ route }) => {
  const { busId } = route.params;
  const [bus, setBus] = useState(null);

  useEffect(() => {
    const busRef = ref(database, `buses/${busId}`);
    const unsubscribe = onValue(busRef, (snapshot) => {
      const busData = snapshot.val();
      if (busData) {
        // Ensure consistent field names
        setBus({
          ...busData,
          BusNumber: busData.BusNumber || busData.busNumber || 'N/A',
          Source: busData.Source || busData.source || 'Unknown',
          destination: busData.destination || busData.Destination || 'Unknown',
          serviceNO: busData.serviceNO || busData.serviceNo || 'N/A',
          DriverName: busData.DriverName || busData.driverName || 'Unknown',
          BusType: busData.BusType || busData.busType || 'Unknown',
          currentCount: busData.currentCount || busData.crowd_count || 0,
          capacity: busData.capacity || 50,
          ScheduleDeparture: busData.ScheduleDeparture || 'N/A',
          ScheduleArrival: busData.ScheduleArrival || 'N/A',
        });
      }
    });

    return () => off(busRef);
  }, [busId]);

  const getCrowdStyle = (count, capacity) => {
    const percentage = (count / capacity) * 100;
    let color = '#4CAF50'; // Green
    let level = 'Low';
    if (percentage > 75) {
      color = '#F44336'; // Red
      level = 'High';
    } else if (percentage > 40) {
      color = '#FFC107'; // Amber
      level = 'Medium';
    }
    return { width: `${percentage}%`, backgroundColor: color, level };
  };

  if (!bus) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF"/>
        <Text>Loading Bus Details...</Text>
      </View>
    );
  }

  const crowdStyle = getCrowdStyle(bus.currentCount, bus.capacity);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.busNumber}>{bus.BusNumber}</Text>
        <Text style={styles.route}>{bus.Source} → {bus.destination}</Text>
      </View>

      <View style={styles.crowdSection}>
        <Text style={styles.sectionTitle}>Live Crowd Meter</Text>
        <View style={styles.crowdIndicator}>
          <View style={[styles.crowdBar, { width: crowdStyle.width, backgroundColor: crowdStyle.backgroundColor }]} />
        </View>
        <Text style={[styles.crowdText, { color: crowdStyle.backgroundColor }]}>
          {crowdStyle.level} ({bus.currentCount} / {bus.capacity})
        </Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Bus Information</Text>
        <View style={styles.infoItem}><Text style={styles.infoLabel}>Driver Name</Text><Text style={styles.infoValue}>{bus.DriverName}</Text></View>
        <View style={styles.infoItem}><Text style={styles.infoLabel}>Service No.</Text><Text style={styles.infoValue}>{bus.serviceNO}</Text></View>
        <View style={styles.infoItem}><Text style={styles.infoLabel}>Bus Type</Text><Text style={styles.infoValue}>{bus.BusType}</Text></View>
        <View style={styles.infoItem}><Text style={styles.infoLabel}>Status</Text><Text style={[styles.infoValue, { color: bus.status === 'active' ? '#4CAF50' : '#F44336' }]}>{bus.status}</Text></View>
      </View>
      
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Schedule</Text>
        <View style={styles.infoItem}><Text style={styles.infoLabel}>Scheduled Departure</Text><Text style={styles.infoValue}>{bus.ScheduleDeparture}</Text></View>
        <View style={styles.infoItem}><Text style={styles.infoLabel}>Scheduled Arrival</Text><Text style={styles.infoValue}>{bus.ScheduleArrival}</Text></View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    alignItems: 'center',
  },
  busNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  route: {
    fontSize: 16,
    color: 'white',
    marginTop: 5,
  },
  crowdSection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  crowdIndicator: {
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  crowdBar: {
    height: '100%',
    borderRadius: 10,
  },
  crowdText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default BusDetailsScreen;
