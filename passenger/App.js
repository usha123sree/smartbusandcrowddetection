import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import PassengerScreen from './screens/PassengerScreen';
import BusDetailsScreen from './screens/BusDetailsScreen';

const Stack = createNativeStackNavigator();

/**
 * This is the main navigator for the Passenger application.
 * It defines the screens available to passengers.
 */
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Find Your Bus' }}
        />
        <Stack.Screen 
          name="Passenger" 
          component={PassengerScreen} 
          options={{ title: 'Live Bus Tracking' }}
        />
        <Stack.Screen 
          name="BusDetails" 
          component={BusDetailsScreen} 
          options={{ title: 'Bus Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
