// screens/ConductorPaymentScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { database } from '../firebase/config';
import { ref, update, push } from 'firebase/database';

const ConductorPaymentScreen = ({ navigation, route }) => {
  const { ticketData, currentBusData } = route.params;
  
  const [showQRModal, setShowQRModal] = useState(false);
  const [customAmount, setCustomAmount] = useState(ticketData.fare.toString());
  const [selectedPassengers, setSelectedPassengers] = useState(1);

  const totalAmount = parseInt(customAmount) * selectedPassengers;

  // Generate QR code with total amount
  const generateQRData = () => {
    return `upi://pay?pa=bus.ticketing@ybl&am=${totalAmount.toFixed(2)}&cu=INR`;
  };

  // Generate fake ticket after manual confirmation
  const generateFakeTicket = async (paymentMethod) => {
    try {
      // Generate fake transaction ID
      const fakeTransactionId = `FAKE${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      // Update passenger counts in Firebase
      const routeKey = `${ticketData.source}-${ticketData.destination}`;
      const currentRouteCount = currentBusData.routeCounts?.[routeKey] || 0;
      const newRouteCount = currentRouteCount + selectedPassengers;
      
      const newTotalCount = (currentBusData.currentCount || 0) + selectedPassengers;

      // Update bus counts in Firebase
      const busRef = ref(database, `buses/${currentBusData.busId}`);
      await update(busRef, { 
        currentCount: newTotalCount,
        routeCounts: {
          ...currentBusData.routeCounts,
          [routeKey]: newRouteCount
        },
        lastUpdated: Date.now()
      });

      // Create fake ticket in Firebase - ensure all fields have values
      const ticketRef = push(ref(database, 'tickets'));
      const ticketDataToSave = {
        id: ticketRef.key,
        busId: currentBusData.busId || 'unknown_bus',
        busNumber: currentBusData.BusNumber || 'Unknown',
        source: ticketData.source || 'Unknown',
        destination: ticketData.destination || 'Unknown',
        passengerType: ticketData.passengerType || 'adult',
        fare: totalAmount || 0,
        paymentMethod: paymentMethod,
        paymentStatus: 'completed',
        transactionId: fakeTransactionId,
        issuedAt: Date.now(),
        passengerCount: selectedPassengers,
        conductorId: currentBusData.DriverName || 'Unknown',
        route: `${ticketData.source} to ${ticketData.destination}`,
        isCrowdCounted: true
      };

      await update(ticketRef, ticketDataToSave);

      // FIXED: Navigate to 'QRCode' instead of 'QRCodeScreen'
      navigation.navigate('QRCode', {
        paymentData: {
          transactionId: fakeTransactionId,
          amount: totalAmount,
          status: 'completed',
          paymentMethod: paymentMethod
        },
        ticketData: {
          ...ticketData,
          fare: totalAmount,
          paymentMethod: paymentMethod,
          passengerCount: selectedPassengers
        },
        currentBusData: {
          ...currentBusData,
          currentCount: newTotalCount
        }
      });

    } catch (error) {
      console.error('Error generating ticket:', error);
      Alert.alert('Error', 'Failed to generate ticket. Please try again.');
    }
  };

  // Handle QR payment completion
  const handleQRPaymentDone = () => {
    generateFakeTicket('online_upi');
    setShowQRModal(false);
  };

  // Handle cash payment
  const handleCashPayment = () => {
    generateFakeTicket('cash');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Collect Payment</Text>

      {/* Fare Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fare Details</Text>
        
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Fare per passenger:</Text>
          <TextInput
            style={styles.amountInput}
            value={customAmount}
            onChangeText={setCustomAmount}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.passengerContainer}>
          <Text style={styles.passengerLabel}>Passengers:</Text>
          <View style={styles.passengerSelector}>
            {[1, 2, 3, 4, 5].map(num => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.passengerButton,
                  selectedPassengers === num && styles.passengerButtonSelected
                ]}
                onPress={() => setSelectedPassengers(num)}
              >
                <Text style={[
                  styles.passengerButtonText,
                  selectedPassengers === num && styles.passengerButtonTextSelected
                ]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalAmount}>₹{totalAmount}</Text>
        </View>
      </View>

      {/* Payment Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        
        <TouchableOpacity 
          style={styles.paymentButton}
          onPress={() => setShowQRModal(true)}
        >
          <Text style={styles.paymentButtonText}>📱 Show QR Code - ₹{totalAmount}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cashButton}
          onPress={handleCashPayment}
        >
          <Text style={styles.cashButtonText}>💵 Cash Payment - ₹{totalAmount}</Text>
        </TouchableOpacity>
      </View>

      {/* QR Code Modal */}
      <Modal visible={showQRModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Scan to Pay</Text>
            <Text style={styles.amountDisplay}>Amount: ₹{totalAmount}</Text>
            
            <View style={styles.qrContainer}>
              <QRCode
                value={generateQRData()}
                size={200}
                color="#000000"
                backgroundColor="#FFFFFF"
              />
            </View>

            <Text style={styles.scanInstruction}>
              Show QR to passenger, then click Done
            </Text>

            <TouchableOpacity 
              style={styles.doneButton}
              onPress={handleQRPaymentDone}
            >
              <Text style={styles.doneButtonText}>✅ Payment Done - Generate Ticket</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowQRModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 16,
    color: '#666',
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    width: 80,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  passengerContainer: {
    marginBottom: 16,
  },
  passengerLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  passengerSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  passengerButton: {
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
    minWidth: 50,
    alignItems: 'center',
  },
  passengerButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  passengerButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  passengerButtonTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  paymentButton: {
    padding: 16,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cashButton: {
    padding: 16,
    backgroundColor: '#FF9800',
    borderRadius: 8,
    alignItems: 'center',
  },
  cashButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    width: '90%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  amountDisplay: {
    fontSize: 18,
    color: '#4CAF50',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  qrContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginBottom: 16,
  },
  scanInstruction: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  doneButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 12,
  },
  cancelButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ConductorPaymentScreen;