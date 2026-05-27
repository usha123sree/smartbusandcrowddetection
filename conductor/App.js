import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ConductorLoginScreen from './screens/ConductorLoginScreen';
import ConductorScreen from './screens/ConductorScreen';
import QRCodeScreen from './screens/QRCodeScreen';
import TicketManagementScreen from './screens/TicketManagementScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import ConductorPaymentScreen from './screens/ConductorPaymentScreen';
import AdminScreen from './screens/AdminScreen'; // FIXED: Remove the comment

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome">
        {/* Welcome Screen */}
        <Stack.Screen 
          name="Welcome" 
          component={WelcomeScreen} 
          options={{ headerShown: false }}
        />
        
        {/* Other Screens */}
        <Stack.Screen name="ConductorLogin" component={ConductorLoginScreen} />
        <Stack.Screen name="Admin" component={AdminScreen} />
        <Stack.Screen name="Conductor" component={ConductorScreen} />
        <Stack.Screen name="Payment" component={ConductorPaymentScreen} />
        <Stack.Screen name="QRCode" component={QRCodeScreen} />
        <Stack.Screen name="TicketManagement" component={TicketManagementScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}