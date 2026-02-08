import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { UserTypeScreen } from '../features/UserTypeScreen';
import { LoginScreen } from '../features/LoginScreen';
import { HomeScreen } from '../features/HomeScreen';
import { EventTabNavigator } from './EventTabNavigator';
import { ProfileScreen } from '../features/ProfileScreen';
import { CrowdMapScreen } from '../features/CrowdMapScreen';
import type { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="UserType"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="UserType" component={UserTypeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="EventHome" component={EventTabNavigator} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="CrowdMap" component={CrowdMapScreen} />
    </Stack.Navigator>
  );
};