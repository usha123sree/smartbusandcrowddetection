// screens/TicketManagementScreen.js - COMPLETE WITH PRINT & DELETE
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  RefreshControl,
  Dimensions,
  Animated,
  Platform
} from 'react-native';
import { database } from '../firebase/config';
import { ref, onValue, off, update, remove } from 'firebase/database';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

const TicketManagementScreen = ({ route, navigation }) => {
  const { busData } = route.params;
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    source: '',
    destination: '',
    paymentMethod: 'all',
    date: ''
  });
  const [stats, setStats] = useState({
    totalTickets: 0,
    totalRevenue: 0,
    cashTickets: 0,
    onlineTickets: 0
  });
  const [showFilters, setShowFilters] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scrollViewRef = useRef();

  useEffect(() => {
    loadTickets();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    return () => {
      // Cleanup
    };
  }, [busData]);

  const loadTickets = () => {
    try {
      const ticketsRef = ref(database, 'tickets');
      
      const unsubscribe = onValue(ticketsRef, (snapshot) => {
        if (snapshot.exists()) {
          const ticketsData = snapshot.val();
          const ticketsArray = Object.keys(ticketsData).map(key => ({
            id: key,
            ...ticketsData[key]
          }));

          // Multiple ways to match the bus
          const busTickets = ticketsArray.filter(ticket => {
            const matchesByBusNumber = ticket.busNumber === busData.BusNumber;
            const matchesByServiceNo = ticket.serviceNO === busData.serviceNO;
            const matchesByDriver = ticket.conductorId === busData.DriverName;
            
            return matchesByBusNumber || matchesByServiceNo || matchesByDriver;
          });

          setTickets(busTickets);
          setFilteredTickets(busTickets);
          calculateStats(busTickets);
        } else {
          setTickets([]);
          setFilteredTickets([]);
          setStats({
            totalTickets: 0,
            totalRevenue: 0,
            cashTickets: 0,
            onlineTickets: 0
          });
        }
      }, (error) => {
        console.error('Firebase error:', error);
        Alert.alert('Error', 'Failed to load tickets: ' + error.message);
      });

      return () => off(ticketsRef, 'value', unsubscribe);
    } catch (error) {
      console.error('Error loading tickets:', error);
      Alert.alert('Error', 'Failed to load tickets');
    }
  };

  const calculateStats = (ticketsList) => {
    const stats = {
      totalTickets: ticketsList.length,
      totalRevenue: 0,
      cashTickets: 0,
      onlineTickets: 0
    };

    ticketsList.forEach(ticket => {
      const fare = Number(ticket.fare) || 0;
      stats.totalRevenue += fare;
      
      // FIXED: Properly categorize online tickets
      if (ticket.paymentMethod === 'cash') {
        stats.cashTickets++;
      } else if (
        ticket.paymentMethod === 'online' || 
        ticket.paymentMethod === 'upi' || 
        ticket.paymentMethod === 'online_upi' ||
        ticket.paymentMethod === 'qr_payment' || // Add this for QR code payments
        (ticket.paymentMethod && ticket.paymentMethod !== 'cash') // Any non-cash is online
      ) {
        stats.onlineTickets++;
      }
    });

    setStats(stats);
  };

  // PRINT FUNCTIONALITY
  const printReport = async () => {
    try {
      Alert.alert('Generating Report', 'Please wait while we generate your report...');
      
      const currentDate = new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const routeSummary = getTicketCountByRoute();
      const currentRoutes = getRouteWiseCrowdInfo();

      // Create HTML content for printing
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Bus Ticket Report - ${busData.BusNumber}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 20px; 
                    color: #333;
                }
                .header { 
                    text-align: center; 
                    border-bottom: 2px solid #2196F3; 
                    padding-bottom: 15px;
                    margin-bottom: 20px;
                }
                .bus-info { 
                    background: #f8f9fa; 
                    padding: 15px; 
                    border-radius: 8px; 
                    margin-bottom: 20px;
                }
                .stats-grid { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 15px; 
                    margin-bottom: 20px;
                }
                .stat-card { 
                    background: #2196F3; 
                    color: white; 
                    padding: 15px; 
                    border-radius: 8px; 
                    text-align: center;
                }
                .section { 
                    margin-bottom: 25px; 
                }
                .section-title { 
                    background: #e3f2fd; 
                    padding: 10px; 
                    border-left: 4px solid #2196F3;
                    margin-bottom: 10px;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-bottom: 15px;
                }
                th, td { 
                    border: 1px solid #ddd; 
                    padding: 8px; 
                    text-align: left;
                }
                th { 
                    background: #f5f5f5; 
                }
                .total-row { 
                    background: #e8f5e8; 
                    font-weight: bold;
                }
                .footer { 
                    text-align: center; 
                    margin-top: 30px; 
                    color: #666; 
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Bus Ticket Management Report</h1>
                <p>Generated on: ${currentDate}</p>
            </div>
            
            <div class="bus-info">
                <h2>${busData.BusNumber} - ${busData.Source} to ${busData.destination}</h2>
                <p><strong>Driver:</strong> ${busData.DriverName}</p>
                <p><strong>Service No:</strong> ${busData.serviceNO}</p>
                <p><strong>Current Passengers:</strong> ${busData.currentCount || 0}/${busData.capacity}</p>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <h3>${stats.totalTickets}</h3>
                    <p>Total Tickets</p>
                </div>
                <div class="stat-card">
                    <h3>₹${stats.totalRevenue}</h3>
                    <p>Total Revenue</p>
                </div>
                <div class="stat-card">
                    <h3>${stats.cashTickets}</h3>
                    <p>Cash Tickets</p>
                </div>
                <div class="stat-card">
                    <h3>${stats.onlineTickets}</h3>
                    <p>Online Tickets</p>
                </div>
            </div>

            <div class="section">
                <div class="section-title">
                    <h3>Current Route Passenger Distribution</h3>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Route</th>
                            <th>Passengers</th>
                            <th>Capacity %</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${currentRoutes.map(route => `
                            <tr>
                                <td>${route.source} → ${route.destination}</td>
                                <td>${route.count}</td>
                                <td>${Math.round((route.count / busData.capacity) * 100)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <div class="section-title">
                    <h3>Route-wise Ticket Summary</h3>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Route</th>
                            <th>Tickets</th>
                            <th>Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${routeSummary.map(route => `
                            <tr>
                                <td>${route.source} → ${route.destination}</td>
                                <td>${route.count}</td>
                                <td>₹${route.revenue}</td>
                            </tr>
                        `).join('')}
                        <tr class="total-row">
                            <td><strong>Total</strong></td>
                            <td><strong>${stats.totalTickets}</strong></td>
                            <td><strong>₹${stats.totalRevenue}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="section">
                <div class="section-title">
                    <h3>Recent Tickets (Last ${Math.min(filteredTickets.length, 10)} of ${filteredTickets.length})</h3>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Route</th>
                            <th>Passenger</th>
                            <th>Fare</th>
                            <th>Payment</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredTickets.slice(0, 10).map(ticket => `
                            <tr>
                                <td>${ticket.source} → ${ticket.destination}</td>
                                <td>${ticket.passengerType}</td>
                                <td>₹${ticket.fare}</td>
                                <td>${ticket.paymentMethod === 'cash' ? 'Cash' : 'Online'}</td>
                                <td>${formatDate(ticket.issuedAt)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="footer">
                <p>Generated by Smart Bus Tracking System</p>
                <p>Report ID: ${busData.BusNumber}_${Date.now()}</p>
            </div>
        </body>
        </html>
      `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      // Share the PDF
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Bus Ticket Report',
      });

      Alert.alert('Success', 'Report generated successfully!');
      
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    }
  };

  // DELETE/RESET ALL DATA FUNCTION
  const deleteAllData = () => {
    Alert.alert(
      'Reset All Data',
      '⚠️ This will reset ALL data for this bus:\n\n• Passenger Count: 0\n• Total Revenue: ₹0\n• Cash Tickets: 0\n• Online Tickets: 0\n• Route Counts: Cleared\n• All Ticket Records: Deleted\n\nThis action cannot be undone!',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              // Reset bus data in Firebase
              const busRef = ref(database, `buses/${busData.busId}`);
              await update(busRef, {
                currentCount: 0,
                routeCounts: {},
                lastTicketUpdate: Date.now()
              });

              // Delete all tickets for this bus from Firebase
              const ticketsRef = ref(database, 'tickets');
              const snapshot = await new Promise((resolve) => {
                onValue(ticketsRef, (snap) => {
                  resolve(snap);
                }, { onlyOnce: true });
              });

              if (snapshot.exists()) {
                const ticketsData = snapshot.val();
                const deletePromises = [];
                
                Object.keys(ticketsData).forEach(ticketId => {
                  const ticket = ticketsData[ticketId];
                  const matchesByBusNumber = ticket.busNumber === busData.BusNumber;
                  const matchesByServiceNo = ticket.serviceNO === busData.serviceNO;
                  const matchesByDriver = ticket.conductorId === busData.DriverName;
                  
                  if (matchesByBusNumber || matchesByServiceNo || matchesByDriver) {
                    const ticketRef = ref(database, `tickets/${ticketId}`);
                    deletePromises.push(remove(ticketRef));
                  }
                });

                await Promise.all(deletePromises);
              }

              // Reload data after deletion
              loadTickets();
              Alert.alert(
                'Success', 
                'All data has been reset successfully!\n\n• Passenger count: 0\n• Revenue: ₹0\n• All tickets cleared\n• Route counts reset'
              );

            } catch (error) {
              console.error('Error resetting data:', error);
              Alert.alert('Error', 'Failed to reset data. Please try again.');
            }
          }
        }
      ]
    );
  };

  const applyFilters = () => {
    let filtered = tickets;

    if (filters.source) {
      filtered = filtered.filter(ticket => 
        ticket.source?.toLowerCase().includes(filters.source.toLowerCase())
      );
    }

    if (filters.destination) {
      filtered = filtered.filter(ticket => 
        ticket.destination?.toLowerCase().includes(filters.destination.toLowerCase())
      );
    }

    if (filters.paymentMethod !== 'all') {
      filtered = filtered.filter(ticket => {
        if (filters.paymentMethod === 'cash') {
          return ticket.paymentMethod === 'cash';
        } else if (filters.paymentMethod === 'online') {
          // FIXED: Include all online payment methods
          return ticket.paymentMethod !== 'cash';
        }
        return true;
      });
    }

    if (filters.date) {
      filtered = filtered.filter(ticket => {
        const ticketDate = new Date(ticket.issuedAt).toLocaleDateString();
        const filterDate = new Date(filters.date).toLocaleDateString();
        return ticketDate === filterDate;
      });
    }

    setFilteredTickets(filtered);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      source: '',
      destination: '',
      paymentMethod: 'all',
      date: ''
    });
    setFilteredTickets(tickets);
    setShowFilters(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTickets();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const resetBusCount = async () => {
    Alert.alert(
      'Reset Passenger Count',
      'Are you sure you want to reset the passenger count to 0?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const busRef = ref(database, `buses/${busData.busId}`);
              await update(busRef, {
                currentCount: 0,
                routeCounts: {},
                lastTicketUpdate: Date.now()
              });
              
              Alert.alert('Success', 'Passenger count has been reset to 0');
            } catch (error) {
              console.error('Error resetting bus count:', error);
              Alert.alert('Error', 'Failed to reset passenger count');
            }
          }
        }
      ]
    );
  };

  const getTicketCountByRoute = () => {
    const routeCounts = {};
    
    filteredTickets.forEach(ticket => {
      const routeKey = `${ticket.source}-${ticket.destination}`;
      if (!routeCounts[routeKey]) {
        routeCounts[routeKey] = {
          source: ticket.source,
          destination: ticket.destination,
          count: 0,
          revenue: 0
        };
      }
      routeCounts[routeKey].count++;
      routeCounts[routeKey].revenue += Number(ticket.fare) || 0;
    });

    return Object.values(routeCounts).sort((a, b) => b.count - a.count);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${amount}`;
  };

  const getRouteWiseCrowdInfo = () => {
    if (!busData.routeCounts) return [];
    
    return Object.entries(busData.routeCounts)
      .map(([routeKey, count]) => {
        const [source, destination] = routeKey.split('-');
        return {
          routeKey,
          source,
          destination,
          count
        };
      })
      .sort((a, b) => b.count - a.count);
  };

  // FIXED: Get payment method display text
  const getPaymentMethodText = (paymentMethod) => {
    if (paymentMethod === 'cash') {
      return 'Cash';
    } else if (paymentMethod === 'qr_payment') {
      return 'QR Code';
    } else if (paymentMethod === 'upi') {
      return 'UPI';
    } else if (paymentMethod === 'online') {
      return 'Online';
    } else {
      return 'Online'; // Default for any other payment method
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Ticket Management</Text>
          <Text style={styles.headerSubtitle}>{busData.BusNumber}</Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Bus Info Card */}
        <View style={styles.busCard}>
          <View style={styles.busInfo}>
            <Text style={styles.busNumber}>{busData.BusNumber}</Text>
            <Text style={styles.busRoute}>{busData.Source} → {busData.destination}</Text>
            <Text style={styles.busDriver}>Driver: {busData.DriverName}</Text>
          </View>
          <View style={styles.passengerInfo}>
            <Text style={styles.passengerCount}>
              {busData.currentCount || 0}<Text style={styles.passengerTotal}>/{busData.capacity}</Text>
            </Text>
            <Text style={styles.passengerLabel}>Current Passengers</Text>
          </View>
        </View>

        {/* Print & Delete Actions */}
        <View style={styles.dangerActionsRow}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.printButton]}
            onPress={printReport}
          >
            <Text style={styles.actionButtonIcon}>🖨️</Text>
            <Text style={styles.actionButtonText}>Print Report</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={deleteAllData}
          >
            <Text style={styles.actionButtonIcon}>🗑️</Text>
            <Text style={styles.actionButtonText}>Reset All</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.filterButton]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text style={styles.actionButtonIcon}>🔍</Text>
            <Text style={styles.actionButtonText}>Filters</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.resetButton]}
            onPress={resetBusCount}
          >
            <Text style={styles.actionButtonIcon}>🔄</Text>
            <Text style={styles.actionButtonText}>Reset Count</Text>
          </TouchableOpacity>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.primaryCard]}>
            <Text style={styles.statNumber}>{stats.totalTickets}</Text>
            <Text style={styles.statLabel}>Total Tickets</Text>
          </View>
          <View style={[styles.statCard, styles.revenueCard]}>
            <Text style={styles.statNumber}>{formatCurrency(stats.totalRevenue)}</Text>
            <Text style={styles.statLabel}>Total Revenue</Text>
          </View>
          <View style={[styles.statCard, styles.cashCard]}>
            <Text style={styles.statNumber}>{stats.cashTickets}</Text>
            <Text style={styles.statLabel}>Cash Tickets</Text>
          </View>
          <View style={[styles.statCard, styles.onlineCard]}>
            <Text style={styles.statNumber}>{stats.onlineTickets}</Text>
            <Text style={styles.statLabel}>Online Tickets</Text>
          </View>
        </View>

        {/* Current Route Counts */}
        {getRouteWiseCrowdInfo().length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Route Passengers</Text>
            <View style={styles.routeCrowdList}>
              {getRouteWiseCrowdInfo().map((route, index) => (
                <View key={route.routeKey} style={styles.routeCrowdItem}>
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeText}>{route.source} → {route.destination}</Text>
                    <Text style={styles.routeCount}>{route.count} passengers</Text>
                  </View>
                  <View style={[
                    styles.crowdIndicator,
                    { backgroundColor: route.count > 30 ? '#FF6B6B' : route.count > 15 ? '#FFD93D' : '#6BCF7F' }
                  ]}>
                    <Text style={styles.crowdPercentage}>
                      {Math.round((route.count / busData.capacity) * 100)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Filters Section */}
        {showFilters && (
          <View style={styles.filtersCard}>
            <Text style={styles.filtersTitle}>Filter Tickets</Text>
            
            <View style={styles.filterInputGroup}>
              <TextInput
                style={styles.filterInput}
                placeholder="Source stop..."
                value={filters.source}
                onChangeText={(text) => setFilters({...filters, source: text})}
              />
              <TextInput
                style={styles.filterInput}
                placeholder="Destination stop..."
                value={filters.destination}
                onChangeText={(text) => setFilters({...filters, destination: text})}
              />
            </View>

            <View style={styles.paymentFilter}>
              <Text style={styles.filterLabel}>Payment Method</Text>
              <View style={styles.paymentOptions}>
                {['all', 'cash', 'online'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.paymentOption,
                      filters.paymentMethod === method && styles.paymentOptionSelected
                    ]}
                    onPress={() => setFilters({...filters, paymentMethod: method})}
                  >
                    <Text style={[
                      styles.paymentOptionText,
                      filters.paymentMethod === method && styles.paymentOptionTextSelected
                    ]}>
                      {method === 'all' ? 'All' : method === 'cash' ? '💵 Cash' : '📱 Online'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.applyFilterButton} onPress={applyFilters}>
                <Text style={styles.applyFilterButtonText}>Apply Filters</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.clearFilterButton} onPress={clearFilters}>
                <Text style={styles.clearFilterButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Route-wise Ticket Summary */}
        {getTicketCountByRoute().length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Route-wise Summary</Text>
              <Text style={styles.sectionSubtitle}>{filteredTickets.length} tickets total</Text>
            </View>
            <View style={styles.routeSummaryList}>
              {getTicketCountByRoute().slice(0, 5).map((route, index) => (
                <View key={index} style={styles.routeSummaryItem}>
                  <View style={styles.routeSummaryInfo}>
                    <Text style={styles.routeSummaryText}>
                      {route.source} → {route.destination}
                    </Text>
                    <Text style={styles.routeSummaryStats}>
                      {route.count} tickets • {formatCurrency(route.revenue)}
                    </Text>
                  </View>
                  <View style={styles.routeSummaryBadge}>
                    <Text style={styles.routeSummaryCount}>{route.count}</Text>
                  </View>
                </View>
              ))}
              {getTicketCountByRoute().length > 5 && (
                <Text style={styles.moreRoutesText}>
                  +{getTicketCountByRoute().length - 5} more routes
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Tickets List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Tickets</Text>
            <Text style={styles.sectionSubtitle}>{filteredTickets.length} found</Text>
          </View>

          {filteredTickets.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🎫</Text>
              <Text style={styles.emptyStateTitle}>No tickets found</Text>
              <Text style={styles.emptyStateText}>
                {tickets.length === 0 ? 'No tickets issued for this bus yet' : 'Try adjusting your filters'}
              </Text>
            </View>
          ) : (
            <View style={styles.ticketsList}>
              {filteredTickets.map((ticket) => (
                <View key={ticket.id} style={styles.ticketItem}>
                  <View style={styles.ticketHeader}>
                    <View style={styles.ticketRoute}>
                      <Text style={styles.ticketSource}>{ticket.source}</Text>
                      <Text style={styles.ticketArrow}>→</Text>
                      <Text style={styles.ticketDestination}>{ticket.destination}</Text>
                    </View>
                    <View style={[
                      styles.paymentType,
                      ticket.paymentMethod === 'cash' ? styles.cashType : styles.onlineType
                    ]}>
                      <Text style={styles.paymentTypeText}>
                        {ticket.paymentMethod === 'cash' ? '💵' : '📱'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.ticketDetails}>
                    <View style={styles.ticketDetailRow}>
                      <Text style={styles.ticketDetailLabel}>Passenger:</Text>
                      <Text style={styles.ticketDetailValue}>{ticket.passengerType}</Text>
                    </View>
                    <View style={styles.ticketDetailRow}>
                      <Text style={styles.ticketDetailLabel}>Fare:</Text>
                      <Text style={styles.ticketFare}>{formatCurrency(ticket.fare)}</Text>
                    </View>
                    <View style={styles.ticketDetailRow}>
                      <Text style={styles.ticketDetailLabel}>Payment:</Text>
                      <Text style={styles.ticketDetailValue}>
                        {getPaymentMethodText(ticket.paymentMethod)}
                      </Text>
                    </View>
                    <View style={styles.ticketDetailRow}>
                      <Text style={styles.ticketDetailLabel}>Time:</Text>
                      <Text style={styles.ticketDetailValue}>{formatDate(ticket.issuedAt)}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Animated.View>
  );
};

// ... (styles remain the same)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  busCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  busInfo: {
    flex: 2,
  },
  busNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  busRoute: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  busDriver: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  passengerInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerCount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  passengerTotal: {
    fontSize: 16,
    color: '#666',
  },
  passengerLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  dangerActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  printButton: {
    backgroundColor: '#17a2b8',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  filterButton: {
    backgroundColor: 'white',
  },
  resetButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    width: (width - 56) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryCard: {
    backgroundColor: '#2196F3',
  },
  revenueCard: {
    backgroundColor: '#4CAF50',
  },
  cashCard: {
    backgroundColor: '#FF9800',
  },
  onlineCard: {
    backgroundColor: '#9C27B0',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  routeCrowdList: {
    gap: 12,
  },
  routeCrowdItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  routeInfo: {
    flex: 1,
  },
  routeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  routeCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  crowdIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crowdPercentage: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  filtersCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  filterInputGroup: {
    gap: 12,
    marginBottom: 16,
  },
  filterInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  paymentFilter: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentOption: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  paymentOptionSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  paymentOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  paymentOptionTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
  },
  applyFilterButton: {
    flex: 2,
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyFilterButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearFilterButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearFilterButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  routeSummaryList: {
    gap: 12,
  },
  routeSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  routeSummaryInfo: {
    flex: 1,
  },
  routeSummaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  routeSummaryStats: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  routeSummaryBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  routeSummaryCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  moreRoutesText: {
    fontSize: 12,
    color: '#2196F3',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  ticketsList: {
    gap: 12,
  },
  ticketItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ticketRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ticketSource: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ticketArrow: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
  },
  ticketDestination: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentType: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cashType: {
    backgroundColor: '#FF9800',
  },
  onlineType: {
    backgroundColor: '#4CAF50',
  },
  paymentTypeText: {
    fontSize: 16,
  },
  ticketDetails: {
    gap: 6,
  },
  ticketDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  ticketDetailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  ticketFare: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 20,
  },
});

export default TicketManagementScreen;