// screens/QRCodeScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const QRCodeScreen = ({ route, navigation }) => {
  const { paymentData, ticketData, currentBusData, qrCodeData, amount } = route.params;

  // Generate QR data if not provided
  const generateQRData = () => {
    if (qrCodeData) return qrCodeData;
    
    return JSON.stringify({
      type: 'bus_ticket',
      ticketId: ticketData.id || `TKT${Date.now()}`,
      transactionId: paymentData.transactionId,
      busNumber: ticketData.busNumber,
      route: `${ticketData.source}-${ticketData.destination}`,
      fare: ticketData.fare,
      timestamp: new Date().toISOString(),
      status: 'valid'
    });
  };

  const handleShareTicket = async () => {
    try {
      const shareContent = {
        message: `🚌 Bus Ticket\n\n` +
                 `Bus: ${ticketData.busNumber}\n` +
                 `Route: ${ticketData.source} → ${ticketData.destination}\n` +
                 `Fare: ₹${ticketData.fare}\n` +
                 `Passenger: ${ticketData.passengerType}\n` +
                 `Transaction ID: ${paymentData.transactionId}\n` +
                 `Issued: ${new Date(ticketData.issuedAt || Date.now()).toLocaleString()}`,
        title: 'Bus Ticket'
      };
      
      await Share.share(shareContent);
    } catch (error) {
      Alert.alert('Error', 'Failed to share ticket');
    }
  };

  const handleDone = () => {
    Alert.alert(
      'Ticket Issued Successfully! 🎫',
      `Transaction ID: ${paymentData.transactionId}\n` +
      `Amount: ₹${ticketData.fare}\n` +
      `Passengers: ${ticketData.passengerCount || 1}\n` +
      `Payment Method: ${ticketData.paymentMethod}\n\n` +
      `Bus: ${ticketData.busNumber}\n` +
      `Route: ${ticketData.source} → ${ticketData.destination}\n\n` +
      `Total Passengers: ${currentBusData.currentCount}/${currentBusData.capacity}`,
      [
        {
          text: 'Issue Another Ticket',
          onPress: () => navigation.navigate('Conductor', { busData: currentBusData })
        },
        {
          text: 'Done',
          onPress: () => navigation.navigate('Conductor', { busData: currentBusData })
        }
      ]
    );
  };

  const qrData = generateQRData();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Payment Successful ✅</Text>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Success Message */}
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>🎫</Text>
          <Text style={styles.successTitle}>Ticket Generated Successfully</Text>
          <Text style={styles.successAmount}>₹{ticketData.fare}</Text>
          <Text style={styles.transactionId}>
            Transaction ID: {paymentData.transactionId}
          </Text>
        </View>

        {/* QR Code */}
        <View style={styles.qrCard}>
          <Text style={styles.qrTitle}>Digital Ticket QR Code</Text>
          <View style={styles.qrContainer}>
            <QRCode
              value={qrData}
              size={250}
              backgroundColor="white"
              color="black"
            />
          </View>
          <Text style={styles.qrNote}>Show this QR code to the conductor</Text>
          <Text style={styles.amountText}>Amount: ₹{ticketData.fare}</Text>
        </View>

        {/* Ticket Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Ticket Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID:</Text>
            <Text style={styles.detailValue}>{paymentData.transactionId}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ticket ID:</Text>
            <Text style={styles.detailValue}>{ticketData.id || `TKT${Date.now()}`}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Bus Number:</Text>
            <Text style={styles.detailValue}>{ticketData.busNumber}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Route:</Text>
            <Text style={styles.detailValue}>{ticketData.source} → {ticketData.destination}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Passenger Type:</Text>
            <Text style={styles.detailValue}>{ticketData.passengerType}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Passengers:</Text>
            <Text style={styles.detailValue}>{ticketData.passengerCount || 1}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fare Paid:</Text>
            <Text style={styles.fareValue}>₹{ticketData.fare}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method:</Text>
            <Text style={styles.detailValue}>{ticketData.paymentMethod}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Issued At:</Text>
            <Text style={styles.detailValue}>
              {new Date(ticketData.issuedAt || Date.now()).toLocaleString()}
            </Text>
            </View>
          
        </View>

        {/* Bus Status */}
        <View style={styles.busStatusCard}>
          <Text style={styles.busStatusTitle}>Current Bus Status</Text>
          <Text style={styles.passengerCount}>
            👥 Passengers: {currentBusData.currentCount}/{currentBusData.capacity}
          </Text>
          <Text style={styles.statusNote}>
            {currentBusData.currentCount >= currentBusData.capacity ? 
              '🚨 Bus is full' : 
              '🟢 Seats available'}
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Instructions</Text>
          <Text style={styles.instruction}>• Keep this QR code ready for inspection</Text>
          <Text style={styles.instruction}>• Show QR code when boarding the bus</Text>
          <Text style={styles.instruction}>• QR code is valid for this journey only</Text>
          <Text style={styles.instruction}>• Amount paid: ₹{ticketData.fare}</Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareTicket}
        >
          <Text style={styles.shareButtonText}>📤 Share Ticket</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleDone}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 16,
    backgroundColor: '#4CAF50',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  successCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  successAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  transactionId: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  qrCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  qrContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  qrNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 5,
  },
  detailsCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  fareValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    flex: 1,
    textAlign: 'right',
  },
  busStatusCard: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  busStatusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2e7d32',
  },
  passengerCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  statusNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  instructionsCard: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1976d2',
  },
  instruction: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 5,
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  doneButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default QRCodeScreen;