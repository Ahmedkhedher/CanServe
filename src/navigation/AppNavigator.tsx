import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
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

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Assessment: undefined;
  Feed: undefined;
  Chat: undefined;
  NutritionCheck: undefined;
  Question: { id: string } | undefined;
  Compose: { mode: 'question' | 'answer'; questionId?: string } | undefined;
  Profile: { userId?: string } | undefined;
  Report: { targetType: 'question' | 'answer' | 'comment'; targetId: string } | undefined;
  Wellness: { cancerType?: string; stage?: string; age?: string } | undefined;
  SuggestionDetail: { title: string; content: string; image?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
// Simple stack: Main (primary), Feed (secondary), others pushed

interface Props {
  isAuthenticated: boolean;
}

const AppNavigator: React.FC<Props> = ({ isAuthenticated }) => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainScreen} />
            <Stack.Screen name="Assessment" component={AssessmentScreen} />
            <Stack.Screen name="Feed" component={FeedScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="NutritionCheck" component={NutritionCheckScreen} />
            <Stack.Screen name="Question" component={QuestionScreen} />
            <Stack.Screen name="Compose" component={ComposeScreen} />
            <Stack.Screen name="Report" component={ReportScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Wellness" component={WellnessScreen} />
            <Stack.Screen name="SuggestionDetail" component={SuggestionDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
