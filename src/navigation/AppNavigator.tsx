import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, Platform } from 'react-native';
import FeedScreen from '../screens/FeedScreen';
import QuestionScreen from '../screens/QuestionScreen';
import ComposeScreen from '../screens/ComposeScreen';
import ProfileScreen from '../screens/ProfileScreen';
// Resources merged into Profile
import ReportScreen from '../screens/ReportScreen';
import WellnessScreen from '../screens/WellnessScreen';
import AssessmentScreen from '../screens/AssessmentScreen';
import SuggestionDetailScreen from '../screens/SuggestionDetailScreen';
import LoginScreen from '../screens/LoginScreen';
import MainScreen from '../screens/MainScreen';
import ChatScreen from '../screens/ChatScreen';
import NutritionCheckScreen from '../screens/NutritionCheckScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import OnboardingSummaryScreen from '../screens/OnboardingSummaryScreen';
import FoodScanScreen from '../screens/FoodScanScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import CalendarScreen from '../screens/CalendarScreen';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Onboarding: undefined;
  OnboardingSummary: undefined;
  Assessment: undefined;
  Feed: undefined;
  Chat: undefined;
  NutritionCheck: undefined;
  FoodScan: undefined;
  Calendar: undefined;
  Question: { id: string } | undefined;
  Compose: { mode: 'question' | 'answer'; questionId?: string } | undefined;
  Profile: { userId?: string } | undefined;
  UserProfile: { userId: string };
  Report: { targetType: 'question' | 'answer' | 'comment'; targetId: string } | undefined;
  Wellness: { cancerType?: string; stage?: string; age?: string } | undefined;
  SuggestionDetail: { title: string; content: string; image?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
// Simple stack: Main (primary), Feed (secondary), others pushed

interface Props {
  isAuthenticated: boolean;
  onboardingNeeded?: boolean;
}

const AppNavigator: React.FC<Props> = ({ isAuthenticated, onboardingNeeded }) => {
  console.log('AppNavigator rendering', { isAuthenticated, onboardingNeeded });
  
  const screenOptions = {
    headerShown: false,
    animation: 'slide_from_right' as const,
    animationDuration: 300,
    animationTypeForReplace: 'push' as const,
    presentation: 'card' as const,
  };

  console.log('Creating NavigationContainer');
  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <Stack.Navigator screenOptions={screenOptions} initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'fade' }} />
        </Stack.Navigator>
      ) : onboardingNeeded ? (
        <Stack.Navigator screenOptions={screenOptions} initialRouteName="Onboarding">
          <Stack.Screen 
            name="Onboarding" 
            component={OnboardingScreen} 
            options={{ 
              animation: 'fade',
              gestureEnabled: false,
            }} 
          />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={screenOptions} initialRouteName="Main">
          <Stack.Screen name="Main" component={MainScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="Assessment" component={AssessmentScreen} />
          <Stack.Screen 
            name="Feed" 
            component={FeedScreen}
            options={{ 
              animation: 'slide_from_right',
              animationDuration: 350,
            }} 
          />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="NutritionCheck" component={NutritionCheckScreen} />
          <Stack.Screen name="FoodScan" component={FoodScanScreen} />
          <Stack.Screen name="Calendar" component={CalendarScreen} />
          <Stack.Screen 
            name="Question" 
            component={QuestionScreen}
            options={{ 
              animation: 'slide_from_right',
              animationDuration: 350,
            }} 
          />
          <Stack.Screen name="Compose" component={ComposeScreen} options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="Report" component={ReportScreen} options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="UserProfile" component={UserProfileScreen} />
          <Stack.Screen name="Wellness" component={WellnessScreen} />
          <Stack.Screen name="SuggestionDetail" component={SuggestionDetailScreen} />
          <Stack.Screen name="OnboardingSummary" component={OnboardingSummaryScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
