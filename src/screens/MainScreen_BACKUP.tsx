import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

const MainScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuth();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>✅ Main Screen Works!</Text>
      <Text style={styles.userText}>User: {user?.displayName || 'Guest'}</Text>
      <TouchableOpacity 
        onPress={() => navigation.navigate('Profile', {})}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Go to Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={() => navigation.navigate('Chat', {})}
        style={[styles.button, { backgroundColor: '#2196F3' }]}
      >
        <Text style={styles.buttonText}>Go to Chat</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold',
    marginBottom: 20
  },
  userText: { 
    fontSize: 18,
    marginBottom: 40
  },
  button: { 
    padding: 20, 
    backgroundColor: '#4CAF50', 
    borderRadius: 10,
    width: '80%',
    marginBottom: 15
  },
  buttonText: { 
    color: 'white', 
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default MainScreen;
