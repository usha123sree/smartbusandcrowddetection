// components/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  StyleSheet,
  TextInput,
  Modal,
  FlatList,
  Dimensions,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { database } from '../firebase/config';
import { ref, set, onValue, remove, update } from 'firebase/database';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

// Color palette for bus types - EACH TYPE GETS UNIQUE COLOR
const BUS_TYPE_COLORS = {
  'AC Sleeper': '#E91E63',      // Pink
  'AC Seater': '#9C27B0',       // Purple
  'Non-AC': '#FF9800',          // Orange
  'Volvo': '#4CAF50',           // Green
  'Standard': '#2196F3',        // Blue
  'Express': '#00BCD4',         // Cyan
  'Deluxe': '#FFC107',          // Amber
  'Luxury': '#FF5722',          // Deep Orange
  'Ordinary': '#795548',        // Brown
  'Sleeper': '#F44336',         // Red
  'Semi-Sleeper': '#3F51B5',    // Indigo
  'Electric': '#8BC34A',        // Light Green
  'Mini Bus': '#FF6B6B',        // Coral
  'Tourist': '#4ECDC4',         // Turquoise
  'Shuttle': '#45B7D1',         // Sky Blue
  'default': '#607D8B'          // Gray
};

// Fallback colors for any bus type not in the predefined list
const FALLBACK_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F5B7B1', '#AED6F1', '#F9E79F', '#A2D9CE', '#FAD7A0'
];

// Function to get color for a bus type
const getBusTypeColor = (busType, index) => {
  if (BUS_TYPE_COLORS[busType]) {
    return BUS_TYPE_COLORS[busType];
  }
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
};

const AdminDashboard = () => {
  const [buses, setBuses] = useState([]);
  const [allTickets, setAllTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('analytics');
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedBusType, setSelectedBusType] = useState('all');
  const [selectedDayType, setSelectedDayType] = useState('all');

  // Available options
  const [availableYears, setAvailableYears] = useState(['all']);
  const [availableMonths, setAvailableMonths] = useState(['all', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);
  const [availableDays, setAvailableDays] = useState(['all']);
  const [availableBusTypes, setAvailableBusTypes] = useState(['all']);

  const [analyticsData, setAnalyticsData] = useState({
    totalBuses: 0,
    totalPassengers: 0,
    totalRevenue: 0,
    totalProfit: 0,
    totalCost: 0,
    activeBuses: 0,
    inactiveBuses: 0,
    activeBusesList: [],
    inactiveBusesList: [],
    cashPayments: 0,
    onlinePayments: 0,
    routeStats: [],
    destinationStats: [],
    bookingChannelStats: [],
    monthlyTrends: [],
    busTypeStats: [],
    dayTypeStats: [],
    avgCustomerRating: 4.2,
    tollCostByDayType: { weekday: 0, weekend: 0 }
  });

  // Form state
  const [formData, setFormData] = useState({
    serviceNO: '',
    Source: '',
    destination: '',
    ScheduleDeparture: '',
    ScheduleArrival: '',
    BusType: '',
    BusNumber: '',
    DepotName: '',
    DriverName: '',
    STOPROUTES: '',
    capacity: '',
    currentCount: '0',
    isActive: false,
    baseFare: '',
    operatingCost: ''
  });

  // Load data from Firebase
  useEffect(() => {
    loadBuses();
    loadTickets();
  }, []);

  // Apply filters whenever filter values change
  useEffect(() => {
    applyFilters();
  }, [selectedYear, selectedMonth, selectedDay, selectedBusType, selectedDayType, allTickets]);

  const loadBuses = () => {
    setLoading(true);
    const busesRef = ref(database, 'buses');
    
    onValue(busesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const busesArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setBuses(busesArray);
        
        // Extract available bus types
        const busTypes = ['all', ...new Set(busesArray.map(bus => bus.BusType).filter(Boolean))];
        setAvailableBusTypes(busTypes);
      } else {
        setBuses([]);
      }
      setLoading(false);
    });
  };

  const loadTickets = () => {
    const ticketsRef = ref(database, 'tickets');
    
    onValue(ticketsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const ticketsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setAllTickets(ticketsArray);
        
        // Extract available years from tickets
        const years = [...new Set(ticketsArray.map(ticket => {
          if (ticket.issuedAt) {
            const date = new Date(ticket.issuedAt);
            return date.getFullYear().toString();
          }
          return null;
        }).filter(Boolean))];
        setAvailableYears(['all', ...years.sort().reverse()]);
        
        // Extract available days from tickets
        const days = [...new Set(ticketsArray.map(ticket => {
          if (ticket.issuedAt) {
            const date = new Date(ticket.issuedAt);
            return date.toLocaleDateString('en-IN');
          }
          return null;
        }).filter(Boolean))];
        setAvailableDays(['all', ...days.sort().reverse()]);
        
      } else {
        setAllTickets([]);
      }
    });
  };

  const applyFilters = () => {
    let filtered = [...allTickets];
    
    if (selectedYear !== 'all') {
      filtered = filtered.filter(ticket => {
        if (!ticket.issuedAt) return false;
        const date = new Date(ticket.issuedAt);
        return date.getFullYear().toString() === selectedYear;
      });
    }
    
    if (selectedMonth !== 'all') {
      const monthMap = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      const selectedMonthNum = monthMap[selectedMonth];
      filtered = filtered.filter(ticket => {
        if (!ticket.issuedAt) return false;
        const date = new Date(ticket.issuedAt);
        return date.getMonth() === selectedMonthNum;
      });
    }
    
    if (selectedDay !== 'all') {
      filtered = filtered.filter(ticket => {
        if (!ticket.issuedAt) return false;
        const date = new Date(ticket.issuedAt);
        return date.toLocaleDateString('en-IN') === selectedDay;
      });
    }
    
    if (selectedBusType !== 'all') {
      filtered = filtered.filter(ticket => {
        const bus = buses.find(b => b.BusNumber === ticket.busNumber);
        return bus?.BusType === selectedBusType;
      });
    }
    
    if (selectedDayType !== 'all') {
      filtered = filtered.filter(ticket => {
        if (!ticket.issuedAt) return false;
        const date = new Date(ticket.issuedAt);
        const day = date.getDay();
        const isWeekend = (day === 0 || day === 6);
        if (selectedDayType === 'Weekday') return !isWeekend;
        if (selectedDayType === 'Weekend') return isWeekend;
        return true;
      });
    }
    
    setFilteredTickets(filtered);
    updateAnalytics(buses, filtered);
  };

  const updateAnalytics = (busesData, ticketsData) => {
    let totalPassengers = 0;
    let totalRevenue = 0;
    let cashPayments = 0;
    let onlinePayments = 0;
    
    const routeStatsMap = new Map();
    const destinationStatsMap = new Map();
    const bookingChannelMap = new Map();
    const monthlyMap = new Map();
    const busTypeCountMap = new Map();
    const dayTypeMap = new Map();

    ticketsData.forEach(ticket => {
      totalPassengers += (ticket.passengerCount || 1);
      const fare = Number(ticket.fare) || 0;
      totalRevenue += fare;
      
      if (ticket.paymentMethod === 'cash') {
        cashPayments++;
      } else {
        onlinePayments++;
      }

      const routeKey = `${ticket.source}-${ticket.destination}`;
      if (routeStatsMap.has(routeKey)) {
        const existing = routeStatsMap.get(routeKey);
        existing.count++;
        existing.revenue += fare;
      } else {
        routeStatsMap.set(routeKey, {
          source: ticket.source,
          destination: ticket.destination,
          count: 1,
          revenue: fare
        });
      }

      if (destinationStatsMap.has(ticket.destination)) {
        const existing = destinationStatsMap.get(ticket.destination);
        existing.count++;
        existing.revenue += fare;
      } else {
        destinationStatsMap.set(ticket.destination, {
          city: ticket.destination,
          count: 1,
          revenue: fare
        });
      }

      let channel = ticket.bookingChannel || (ticket.paymentMethod === 'cash' ? 'Counter Booking' : 'Mobile App');
      if (channel === 'cash') channel = 'Counter Booking';
      if (channel === 'online' || channel === 'upi' || channel === 'qr_payment') channel = 'Mobile App';
      
      if (bookingChannelMap.has(channel)) {
        const existing = bookingChannelMap.get(channel);
        existing.count++;
        existing.revenue += fare;
      } else {
        bookingChannelMap.set(channel, {
          channel: channel,
          count: 1,
          revenue: fare
        });
      }

      if (ticket.issuedAt) {
        const date = new Date(ticket.issuedAt);
        const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
        if (monthlyMap.has(monthYear)) {
          const existing = monthlyMap.get(monthYear);
          existing.revenue += fare;
          existing.count++;
        } else {
          monthlyMap.set(monthYear, {
            month: date.getMonth() + 1,
            year: date.getFullYear(),
            revenue: fare,
            count: 1
          });
        }

        const day = date.getDay();
        const isWeekend = (day === 0 || day === 6);
        const dayType = isWeekend ? 'Weekend' : 'Weekday';
        if (dayTypeMap.has(dayType)) {
          const existing = dayTypeMap.get(dayType);
          existing.revenue += fare;
          existing.count++;
        } else {
          dayTypeMap.set(dayType, {
            type: dayType,
            revenue: fare,
            count: 1
          });
        }
      }
    });

    // Calculate bus type statistics from buses data
    busesData.forEach(bus => {
      const busType = bus.BusType || 'Standard';
      if (busTypeCountMap.has(busType)) {
        const existing = busTypeCountMap.get(busType);
        existing.count++;
        existing.passengers += (bus.currentCount || 0);
        existing.capacity += (bus.capacity || 0);
      } else {
        busTypeCountMap.set(busType, {
          type: busType,
          count: 1,
          passengers: bus.currentCount || 0,
          capacity: bus.capacity || 0
        });
      }
    });

    const routeStats = Array.from(routeStatsMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const destinationStats = Array.from(destinationStatsMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const bookingChannelStats = Array.from(bookingChannelMap.values())
      .sort((a, b) => b.revenue - a.revenue);

    const monthlyTrends = Array.from(monthlyMap.values())
      .sort((a, b) => a.year - b.year || a.month - b.month)
      .slice(0, 12);

    const busTypeStats = Array.from(busTypeCountMap.values());

    const dayTypeStats = Array.from(dayTypeMap.values());

    const activeBusesList = busesData
      .filter(bus => bus.isActive === true)
      .map(bus => ({
        busNumber: bus.BusNumber,
        serviceNO: bus.serviceNO,
        driverName: bus.DriverName,
        route: `${bus.Source} → ${bus.destination}`,
        capacity: bus.capacity || 0,
        currentCount: bus.currentCount || 0,
        busType: bus.BusType || 'Standard',
        utilizationRate: ((bus.currentCount || 0) / (bus.capacity || 1)) * 100
      }));

    const inactiveBusesList = busesData
      .filter(bus => bus.isActive === false || bus.isActive === undefined)
      .map(bus => ({
        busNumber: bus.BusNumber,
        serviceNO: bus.serviceNO,
        driverName: bus.DriverName,
        route: `${bus.Source} → ${bus.destination}`,
        capacity: bus.capacity || 0,
        busType: bus.BusType || 'Standard',
        lastUpdated: bus.lastUpdated ? new Date(bus.lastUpdated).toLocaleDateString() : 'N/A'
      }));

    const totalCost = totalRevenue * 0.65;
    const totalProfit = totalRevenue - totalCost;

    const tollCostByDayType = {
      weekday: totalRevenue * 0.05,
      weekend: totalRevenue * 0.08
    };

    setAnalyticsData({
      totalBuses: busesData.length,
      totalPassengers,
      totalRevenue,
      totalProfit,
      totalCost,
      activeBuses: activeBusesList.length,
      inactiveBuses: inactiveBusesList.length,
      activeBusesList,
      inactiveBusesList,
      cashPayments,
      onlinePayments,
      routeStats,
      destinationStats,
      bookingChannelStats,
      monthlyTrends,
      busTypeStats,
      dayTypeStats,
      avgCustomerRating: 4.2,
      tollCostByDayType
    });
  };

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${Math.round(amount)}`;
  };

  const resetFilters = () => {
    setSelectedYear('all');
    setSelectedMonth('all');
    setSelectedDay('all');
    setSelectedBusType('all');
    setSelectedDayType('all');
  };

  const filteredBuses = buses.filter(bus => 
    bus.serviceNO?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bus.BusNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bus.DriverName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bus.Source?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bus.destination?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      serviceNO: '',
      Source: '',
      destination: '',
      ScheduleDeparture: '',
      ScheduleArrival: '',
      BusType: '',
      BusNumber: '',
      DepotName: '',
      DriverName: '',
      STOPROUTES: '',
      capacity: '',
      currentCount: '0',
      isActive: false,
      baseFare: '',
      operatingCost: ''
    });
    setEditingBus(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (bus) => {
    setFormData({
      serviceNO: bus.serviceNO || '',
      Source: bus.Source || '',
      destination: bus.destination || '',
      ScheduleDeparture: bus.ScheduleDeparture || '',
      ScheduleArrival: bus.ScheduleArrival || '',
      BusType: bus.BusType || '',
      BusNumber: bus.BusNumber || '',
      DepotName: bus.DepotName || '',
      DriverName: bus.DriverName || '',
      STOPROUTES: bus.STOPROUTES || '',
      capacity: bus.capacity?.toString() || '',
      currentCount: bus.currentCount?.toString() || '0',
      isActive: bus.isActive || false,
      baseFare: bus.baseFare?.toString() || '',
      operatingCost: bus.operatingCost?.toString() || ''
    });
    setEditingBus(bus);
    setModalVisible(true);
  };

  const saveBus = async () => {
    if (!formData.serviceNO || !formData.BusNumber) {
      Alert.alert('Error', 'Service NO and Bus Number are required');
      return;
    }

    try {
      setLoading(true);
      
      const busId = editingBus?.id || `bus_${Date.now()}`;
      const busRef = ref(database, `buses/${busId}`);
      
      const busData = {
        ...formData,
        capacity: parseInt(formData.capacity) || 0,
        currentCount: parseInt(formData.currentCount) || 0,
        baseFare: parseInt(formData.baseFare) || 0,
        operatingCost: parseInt(formData.operatingCost) || 0,
        lastUpdated: Date.now(),
        location: formData.location || null
      };

      await set(busRef, busData);
      
      Alert.alert('Success', editingBus ? 'Bus updated successfully!' : 'Bus added successfully!');
      setModalVisible(false);
      resetForm();
      
    } catch (error) {
      console.error('Error saving bus:', error);
      Alert.alert('Error', 'Failed to save bus data');
    } finally {
      setLoading(false);
    }
  };

  const deleteBus = (bus) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete bus ${bus.BusNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const busRef = ref(database, `buses/${bus.id}`);
              await remove(busRef);
              Alert.alert('Success', 'Bus deleted successfully!');
            } catch (error) {
              console.error('Error deleting bus:', error);
              Alert.alert('Error', 'Failed to delete bus');
            }
          }
        }
      ]
    );
  };

  const toggleBusStatus = async (bus) => {
    try {
      const busRef = ref(database, `buses/${bus.id}`);
      await update(busRef, {
        isActive: !bus.isActive,
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error('Error updating bus status:', error);
      Alert.alert('Error', 'Failed to update bus status');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBuses();
    loadTickets();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#2196F3"
    }
  };

  const busStatusData = [
    {
      name: `Active (${analyticsData.activeBuses})`,
      population: analyticsData.activeBuses,
      color: "#4CAF50",
      legendFontColor: "#333",
      legendFontSize: 12
    },
    {
      name: `Inactive (${analyticsData.inactiveBuses})`,
      population: analyticsData.inactiveBuses,
      color: "#F44336",
      legendFontColor: "#333",
      legendFontSize: 12
    }
  ];

  const bookingChannelData = analyticsData.bookingChannelStats.map(channel => ({
    name: channel.channel,
    population: channel.revenue,
    color: channel.channel === 'Counter Booking' ? '#FF9800' :
           channel.channel === 'Website' ? '#2196F3' :
           channel.channel === 'Travel Agent' ? '#9C27B0' :
           channel.channel === 'Mobile App' ? '#4CAF50' : '#FFC107',
    legendFontColor: "#333",
    legendFontSize: 12
  }));

  const monthlyChartData = {
    labels: analyticsData.monthlyTrends.map(m => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return monthNames[m.month - 1];
    }),
    datasets: [{
      data: analyticsData.monthlyTrends.map(m => m.revenue / 1000),
      color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
      strokeWidth: 2
    }]
  };

  const routeChartData = {
    labels: analyticsData.routeStats.slice(0, 5).map(r => 
      `${r.source?.substring(0, 4) || ''}→${r.destination?.substring(0, 4) || ''}`
    ),
    datasets: [{
      data: analyticsData.routeStats.slice(0, 5).map(r => r.count)
    }]
  };

  // Bus type distribution pie chart with UNIQUE COLORS for each section
  const busTypeChartData = analyticsData.busTypeStats.map((type, index) => ({
    name: `${type.type} (${type.count})`,
    population: type.count,
    color: getBusTypeColor(type.type, index),
    legendFontColor: "#333",
    legendFontSize: 11,
    legendFontWeight: "500"
  }));

  const renderAnalytics = () => (
    <ScrollView 
      style={styles.analyticsContainer} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Year:</Text>
            {availableYears.slice(0, 5).map(year => (
              <TouchableOpacity 
                key={year}
                style={[styles.filterChip, selectedYear === year && styles.filterChipActive]}
                onPress={() => setSelectedYear(year)}
              >
                <Text style={[styles.filterChipText, selectedYear === year && styles.filterChipTextActive]}>{year === 'all' ? 'All' : year}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Month:</Text>
            {availableMonths.map(month => (
              <TouchableOpacity 
                key={month}
                style={[styles.filterChip, selectedMonth === month && styles.filterChipActive]}
                onPress={() => setSelectedMonth(month)}
              >
                <Text style={[styles.filterChipText, selectedMonth === month && styles.filterChipTextActive]}>{month}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Date:</Text>
            <TouchableOpacity 
              style={[styles.filterChip, selectedDay !== 'all' && styles.filterChipActive]}
              onPress={() => {
                if (availableDays.length > 1) {
                  Alert.alert(
                    'Select Date',
                    'Choose a date to filter',
                    availableDays.slice(0, 10).map(day => ({
                      text: day === 'all' ? 'All Dates' : day,
                      onPress: () => setSelectedDay(day)
                    })).concat([{ text: 'Cancel', style: 'cancel' }])
                  );
                }
              }}
            >
              <Text style={styles.filterChipText}>
                {selectedDay === 'all' ? 'All Dates' : selectedDay.substring(0, 10)}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Bus Type:</Text>
            {availableBusTypes.slice(0, 4).map(type => (
              <TouchableOpacity 
                key={type}
                style={[styles.filterChip, selectedBusType === type && styles.filterChipActive]}
                onPress={() => setSelectedBusType(type)}
              >
                <Text style={[styles.filterChipText, selectedBusType === type && styles.filterChipTextActive]}>{type === 'all' ? 'All' : type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Day Type:</Text>
            {['all', 'Weekday', 'Weekend'].map(day => (
              <TouchableOpacity 
                key={day}
                style={[styles.filterChip, selectedDayType === day && styles.filterChipActive]}
                onPress={() => setSelectedDayType(day)}
              >
                <Text style={[styles.filterChipText, selectedDayType === day && styles.filterChipTextActive]}>{day === 'all' ? 'All' : day}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.resetFilterChip} onPress={resetFilters}>
            <Text style={styles.resetFilterText}>Reset All</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {(selectedYear !== 'all' || selectedMonth !== 'all' || selectedDay !== 'all' || selectedBusType !== 'all' || selectedDayType !== 'all') && (
        <View style={styles.activeFiltersBar}>
          <Text style={styles.activeFiltersLabel}>Active Filters:</Text>
          {selectedYear !== 'all' && <Text style={styles.activeFilterTag}>Year: {selectedYear}</Text>}
          {selectedMonth !== 'all' && <Text style={styles.activeFilterTag}>Month: {selectedMonth}</Text>}
          {selectedDay !== 'all' && <Text style={styles.activeFilterTag}>Date: {selectedDay.substring(0, 10)}</Text>}
          {selectedBusType !== 'all' && <Text style={styles.activeFilterTag}>Bus: {selectedBusType}</Text>}
          {selectedDayType !== 'all' && <Text style={styles.activeFilterTag}>Day: {selectedDayType}</Text>}
          <Text style={styles.filteredCount}>📊 {filteredTickets.length} tickets found</Text>
        </View>
      )}

      {/* KPI Cards */}
      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, styles.revenueCard]}>
          <Text style={styles.kpiValue}>{formatCurrency(analyticsData.totalRevenue)}</Text>
          <Text style={styles.kpiLabel}>Revenue</Text>
        </View>
        <View style={[styles.kpiCard, styles.costCard]}>
          <Text style={styles.kpiValue}>{formatCurrency(analyticsData.totalCost)}</Text>
          <Text style={styles.kpiLabel}>Total Cost</Text>
        </View>
        <View style={[styles.kpiCard, styles.profitCard]}>
          <Text style={styles.kpiValue}>{formatCurrency(analyticsData.totalProfit)}</Text>
          <Text style={styles.kpiLabel}>Profit</Text>
        </View>
        <View style={[styles.kpiCard, styles.ratingCard]}>
          <Text style={styles.kpiValue}>★ {analyticsData.avgCustomerRating}</Text>
          <Text style={styles.kpiLabel}>Avg. Rating</Text>
        </View>
      </View>

      {/* Additional Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statsCard}>
          <Text style={styles.statsCardNumber}>{analyticsData.totalPassengers}</Text>
          <Text style={styles.statsCardLabel}>Total Passengers</Text>
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.statsCardNumber}>{analyticsData.cashPayments}</Text>
          <Text style={styles.statsCardLabel}>Cash Payments</Text>
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.statsCardNumber}>{analyticsData.onlinePayments}</Text>
          <Text style={styles.statsCardLabel}>Online Payments</Text>
        </View>
      </View>

      {/* Bus Status Distribution */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>🚌 Bus Status Distribution</Text>
        {analyticsData.totalBuses > 0 ? (
          <>
            <PieChart
              data={busStatusData}
              width={width - 40}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
            <View style={styles.statusSummary}>
              <View style={styles.statusSummaryItem}>
                <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.statusSummaryText}>Active Buses: {analyticsData.activeBuses}</Text>
              </View>
              <View style={styles.statusSummaryItem}>
                <View style={[styles.statusDot, { backgroundColor: '#F44336' }]} />
                <Text style={styles.statusSummaryText}>Inactive Buses: {analyticsData.inactiveBuses}</Text>
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.noDataText}>No bus data available</Text>
        )}
      </View>

      {/* Bus Type Distribution - COLORFUL PIE CHART WITH UNIQUE COLORS */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>🚌 Bus Type Distribution</Text>
        {analyticsData.busTypeStats.length > 0 ? (
          <>
            <PieChart
              data={busTypeChartData}
              width={width - 40}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
            {/* Colorful Legend */}
            <View style={styles.busTypeLegend}>
              {analyticsData.busTypeStats.map((type, index) => {
                const color = getBusTypeColor(type.type, index);
                return (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: color }]} />
                    <Text style={styles.legendText}>{type.type}: {type.count} bus{type.count !== 1 ? 'es' : ''}</Text>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <Text style={styles.noDataText}>No bus type data available</Text>
        )}
      </View>

      {/* Toll Cost */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>🛣️ Toll Cost by Day Type</Text>
        <View style={styles.tollChart}>
          <View style={styles.tollBarContainer}>
            <Text style={styles.tollLabel}>Weekday</Text>
            <View style={styles.tollBarBackground}>
              <View style={[styles.tollBarFill, { width: `${Math.min((analyticsData.tollCostByDayType.weekday / (analyticsData.totalRevenue || 1)) * 100, 100)}%` }]} />
            </View>
            <Text style={styles.tollValue}>{formatCurrency(analyticsData.tollCostByDayType.weekday)}</Text>
          </View>
          <View style={styles.tollBarContainer}>
            <Text style={styles.tollLabel}>Weekend</Text>
            <View style={styles.tollBarBackground}>
              <View style={[styles.tollBarFill, { width: `${Math.min((analyticsData.tollCostByDayType.weekend / (analyticsData.totalRevenue || 1)) * 100, 100)}%` }]} />
            </View>
            <Text style={styles.tollValue}>{formatCurrency(analyticsData.tollCostByDayType.weekend)}</Text>
          </View>
        </View>
      </View>

      {/* Profit by Booking Channel */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>💰 Profit by Booking Channel</Text>
        {bookingChannelData.length > 0 ? (
          <PieChart
            data={bookingChannelData}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        ) : (
          <Text style={styles.noDataText}>No booking data available</Text>
        )}
      </View>

      {/* Monthly Trends */}
      {analyticsData.monthlyTrends.length > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>📈 Monthly Revenue Trends</Text>
          <LineChart
            data={monthlyChartData}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            formatYLabel={(value) => `₹${value}K`}
          />
        </View>
      )}

      {/* Route Analysis */}
      {analyticsData.routeStats.length > 0 && (
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>🚏 Route Name Analysis</Text>
          <View style={styles.routeList}>
            {analyticsData.routeStats.slice(0, 5).map((route, index) => (
              <View key={index} style={styles.routeItem}>
                <Text style={styles.routeName}>{route.source} → {route.destination}</Text>
                <Text style={styles.routeCount}>{route.count} bookings</Text>
                <Text style={styles.routeRevenue}>{formatCurrency(route.revenue)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Destination Analysis */}
      {analyticsData.destinationStats.length > 0 && (
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>🏙️ Destination City Analysis</Text>
          <View style={styles.destinationList}>
            {analyticsData.destinationStats.slice(0, 5).map((dest, index) => (
              <View key={index} style={styles.destinationItem}>
                <Text style={styles.destinationName}>{dest.city}</Text>
                <Text style={styles.destinationCount}>{dest.count} passengers</Text>
                <Text style={styles.destinationRevenue}>{formatCurrency(dest.revenue)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Active Buses */}
      {analyticsData.activeBusesList.length > 0 && (
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: '#4CAF50' }]}>✅ Active Buses ({analyticsData.activeBusesList.length})</Text>
          {analyticsData.activeBusesList.slice(0, 5).map((bus, index) => (
            <View key={index} style={styles.busStatusItem}>
              <View style={styles.busStatusHeader}>
                <Text style={styles.busStatusNumber}>{bus.busNumber}</Text>
                <View style={[styles.busStatusBadge, styles.activeBadge]}>
                  <Text style={styles.busStatusBadgeText}>ACTIVE</Text>
                </View>
              </View>
              <Text style={styles.busStatusRoute}>{bus.route}</Text>
              <Text style={styles.busStatusDetail}>{bus.busType} • Driver: {bus.driverName}</Text>
              <Text style={styles.busStatusDetail}>
                Passengers: {bus.currentCount}/{bus.capacity} ({Math.round(bus.utilizationRate)}% full)
              </Text>
              <View style={styles.utilizationBar}>
                <View style={[styles.utilizationFill, { width: `${Math.min(bus.utilizationRate, 100)}%` }]} />
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderBusList = () => (
    <>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Service NO, Bus Number, Driver..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Add New Bus</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredBuses}
          renderItem={renderBusItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No buses found</Text>
          }
        />
      )}
    </>
  );

  const renderBusItem = ({ item }) => (
    <View style={styles.busCard}>
      <View style={styles.busHeader}>
        <Text style={styles.busNumber}>{item.BusNumber}</Text>
        <TouchableOpacity 
          style={[styles.statusIndicator, item.isActive ? styles.active : styles.inactive]}
          onPress={() => toggleBusStatus(item)}
        >
          <Text style={styles.statusText}>
            {item.isActive ? '● ACTIVE' : '○ INACTIVE'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.serviceNO}>{item.serviceNO}</Text>
      <Text style={styles.route}>
        {item.Source} → {item.destination}
      </Text>
      <Text style={styles.driver}>Driver: {item.DriverName}</Text>
      <Text style={styles.busTypeText}>Type: {item.BusType || 'Standard'}</Text>
      <Text style={styles.depot}>Depot: {item.DepotName}</Text>
      <Text style={styles.schedule}>
        {item.ScheduleDeparture} - {item.ScheduleArrival}
      </Text>
      <Text style={styles.capacity}>
        Capacity: {item.currentCount || 0}/{item.capacity || 0}
      </Text>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditModal(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteBus(item)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Intercity Bus Services Dashboard</Text>
        <Text style={styles.subtitle}>Total Buses: {buses.length} | Total Passengers: {analyticsData.totalPassengers}</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
          onPress={() => setActiveTab('analytics')}
        >
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
            📊 Analytics Dashboard
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'buses' && styles.activeTab]}
          onPress={() => setActiveTab('buses')}
        >
          <Text style={[styles.tabText, activeTab === 'buses' && styles.activeTabText]}>
            🚌 Bus Management
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'analytics' ? renderAnalytics() : renderBusList()}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingBus ? 'Edit Bus' : 'Add New Bus'}
            </Text>

            <ScrollView style={styles.formContainer}>
              {[
                { key: 'serviceNO', label: 'Service NO', placeholder: 'KGL 1/3' },
                { key: 'BusNumber', label: 'Bus Number', placeholder: 'AP39Z0868' },
                { key: 'Source', label: 'Source', placeholder: 'Proddutur' },
                { key: 'destination', label: 'Destination', placeholder: 'Kurnool' },
                { key: 'ScheduleDeparture', label: 'Departure Time', placeholder: '04:30:00' },
                { key: 'ScheduleArrival', label: 'Arrival Time', placeholder: '08:45:00' },
                { key: 'BusType', label: 'Bus Type', placeholder: 'AC Sleeper / AC Seater / Non-AC' },
                { key: 'DepotName', label: 'Depot Name', placeholder: 'koyalakuntla' },
                { key: 'DriverName', label: 'Driver Name', placeholder: 'K NARASHUDU' },
                { key: 'STOPROUTES', label: 'Route Stops', placeholder: 'PRODDUTUR-DEVAGUDI...', multiline: true },
                { key: 'capacity', label: 'Capacity', placeholder: '50', keyboardType: 'numeric' },
                { key: 'currentCount', label: 'Current Count', placeholder: '0', keyboardType: 'numeric' },
                { key: 'baseFare', label: 'Base Fare (₹)', placeholder: '10', keyboardType: 'numeric' },
                { key: 'operatingCost', label: 'Operating Cost (₹)', placeholder: '8', keyboardType: 'numeric' },
              ].map((field) => (
                <View key={field.key} style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{field.label}</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      field.multiline && styles.multilineInput
                    ]}
                    value={formData[field.key]}
                    onChangeText={(text) => handleInputChange(field.key, text)}
                    placeholder={field.placeholder}
                    multiline={field.multiline}
                    numberOfLines={field.multiline ? 3 : 1}
                    keyboardType={field.keyboardType || 'default'}
                  />
                </View>
              ))}

              <View style={styles.checkboxGroup}>
                <TouchableOpacity 
                  style={styles.checkbox}
                  onPress={() => handleInputChange('isActive', !formData.isActive)}
                >
                  <View style={[
                    styles.checkboxBox,
                    formData.isActive && styles.checkboxChecked
                  ]}>
                    {formData.isActive && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Bus is Active</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveBus}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  filterBar: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#2196F3',
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
  },
  filterChipTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  resetFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FF9800',
    marginRight: 8,
  },
  resetFilterText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  activeFiltersBar: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  activeFiltersLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1976d2',
    marginRight: 8,
  },
  activeFilterTag: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 10,
    color: 'white',
    marginRight: 8,
    marginBottom: 4,
  },
  filteredCount: {
    fontSize: 11,
    color: '#666',
    marginLeft: 'auto',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: (width - 56) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  revenueCard: {
    backgroundColor: '#2196F3',
  },
  costCard: {
    backgroundColor: '#FF9800',
  },
  profitCard: {
    backgroundColor: '#4CAF50',
  },
  ratingCard: {
    backgroundColor: '#9C27B0',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statsCardNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statsCardLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  chartSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statusSummary: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 20,
  },
  statusSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  statusSummaryText: {
    fontSize: 12,
    color: '#666',
  },
  busTypeLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  tollChart: {
    gap: 12,
  },
  tollBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tollLabel: {
    width: 70,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  tollBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tollBarFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  tollValue: {
    width: 70,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  statsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeList: {
    gap: 12,
  },
  routeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  routeName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 2,
  },
  routeCount: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    textAlign: 'center',
  },
  routeRevenue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
    flex: 1,
    textAlign: 'right',
  },
  destinationList: {
    gap: 12,
  },
  destinationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  destinationName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 2,
  },
  destinationCount: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    textAlign: 'center',
  },
  destinationRevenue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
    flex: 1,
    textAlign: 'right',
  },
  busStatusItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  busStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  busStatusNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  busStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#D4EDDA',
  },
  busStatusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#155724',
  },
  busStatusRoute: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 4,
  },
  busStatusDetail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  utilizationBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  utilizationFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    flex: 1,
  },
  addButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  refreshButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    width: 100,
  },
  refreshButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  busCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  busNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  active: {
    backgroundColor: '#D4EDDA',
  },
  inactive: {
    backgroundColor: '#F8D7DA',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#155724',
  },
  serviceNO: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  route: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 4,
  },
  driver: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  busTypeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  depot: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  schedule: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  capacity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
  },
  editButton: {
    backgroundColor: '#FFC107',
  },
  deleteButton: {
    backgroundColor: '#DC3545',
  },
  actionButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 12,
  },
  loader: {
    marginTop: 50,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#999',
  },
  noDataText: {
    textAlign: 'center',
    padding: 40,
    fontSize: 14,
    color: '#999',
  },
  analyticsContainer: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  formContainer: {
    padding: 20,
    maxHeight: 500,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  checkboxGroup: {
    marginBottom: 20,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalButton: {
    flex: 1,
    padding: 15,
  },
  cancelButton: {
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminDashboard;