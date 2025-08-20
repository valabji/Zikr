import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import Colors from '../constants/Colors';
import { t } from '../locales/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import zikr from '../constants/Azkar';

const ContributionScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [selectedZikr, setSelectedZikr] = useState(null);
  const [translation, setTranslation] = useState('');
  const [filteredZikr, setFilteredZikr] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [contributions, setContributions] = useState([]);

  useEffect(() => {
    loadContributions();
    // Get unique zikr items (remove duplicates based on zekr text)
    const uniqueZikr = zikr.filter((item, index, self) =>
      index === self.findIndex(z => z.zekr === item.zekr)
    );
    setFilteredZikr(uniqueZikr);
  }, []);

  useEffect(() => {
    if (searchText) {
      const filtered = zikr.filter(item =>
        item.category.includes(searchText) ||
        item.zekr.includes(searchText) ||
        (item.description && item.description.includes(searchText))
      );
      setFilteredZikr(filtered);
    } else {
      const uniqueZikr = zikr.filter((item, index, self) =>
        index === self.findIndex(z => z.zekr === item.zekr)
      );
      setFilteredZikr(uniqueZikr);
    }
  }, [searchText]);

  const loadContributions = async () => {
    try {
      const stored = await AsyncStorage.getItem('@contributions');
      if (stored) {
        setContributions(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading contributions:', error);
    }
  };

  const handleSubmitTranslation = async () => {
    if (!selectedZikr || !translation.trim()) {
      Alert.alert('Error', 'Please select a Zikr and enter a translation');
      return;
    }

    try {
      const newContribution = {
        id: Date.now(),
        userId: user.id,
        userName: user.name,
        zikrId: selectedZikr.zekr, // Use zekr text as unique ID
        zikrCategory: selectedZikr.category,
        zikrText: selectedZikr.zekr,
        translation: translation.trim(),
        language: 'en', // Default to English for now
        status: 'pending', // pending, approved, rejected
        createdAt: new Date().toISOString(),
      };

      const updatedContributions = [...contributions, newContribution];
      await AsyncStorage.setItem('@contributions', JSON.stringify(updatedContributions));
      setContributions(updatedContributions);

      Alert.alert(
        'Success',
        'Thank you for your contribution! It will be reviewed and added to the app.',
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedZikr(null);
              setTranslation('');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit contribution');
    }
  };

  const renderZikrItem = ({ item, index }) => {
    const isSelected = selectedZikr && selectedZikr.zekr === item.zekr;
    
    return (
      <TouchableOpacity
        style={[styles.zikrItem, isSelected && styles.selectedZikrItem]}
        onPress={() => setSelectedZikr(item)}
      >
        <Text style={styles.categoryText}>{item.category}</Text>
        <Text style={styles.zikrText} numberOfLines={2}>
          {item.zekr}
        </Text>
        {isSelected && (
          <Feather name="check" size={20} color={Colors.BYellow} style={styles.checkIcon} />
        )}
      </TouchableOpacity>
    );
  };

  if (!user) {
    return (
      <LinearGradient colors={[Colors.BGreen, Colors.DGreen]} style={styles.container}>
        <View style={styles.notAuthContainer}>
          <Text style={styles.notAuthText}>Please log in to contribute translations</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Auth')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[Colors.BGreen, Colors.DGreen]} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-right" size={24} color={Colors.BYellow} />
        </TouchableOpacity>
        <Text style={styles.title}>Contribute Translations</Text>
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.welcomeText}>Welcome, {user.name}!</Text>
        <Text style={styles.contributionsCount}>
          Your contributions: {contributions.filter(c => c.userId === user.id).length}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Zikr..."
          placeholderTextColor={Colors.BGreen}
          value={searchText}
          onChangeText={setSearchText}
          textAlign="right"
        />
        <Feather name="search" size={20} color={Colors.BGreen} style={styles.searchIcon} />
      </View>

      <Text style={styles.sectionTitle}>Select a Zikr to Translate:</Text>
      
      <FlatList
        data={filteredZikr.slice(0, 20)} // Limit to 20 items for performance
        keyExtractor={(item, index) => `${item.zekr}-${index}`}
        renderItem={renderZikrItem}
        style={styles.zikrList}
        showsVerticalScrollIndicator={false}
      />

      {selectedZikr && (
        <View style={styles.translationContainer}>
          <Text style={styles.selectedZikrTitle}>Selected Zikr:</Text>
          <Text style={styles.selectedZikrText}>{selectedZikr.zekr}</Text>
          
          <Text style={styles.translationLabel}>Your English Translation:</Text>
          <TextInput
            style={styles.translationInput}
            placeholder="Enter English translation..."
            placeholderTextColor={Colors.BGreen}
            value={translation}
            onChangeText={setTranslation}
            multiline
            textAlignVertical="top"
          />
          
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitTranslation}
          >
            <Text style={styles.submitButtonText}>Submit Translation</Text>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.BYellow,
    fontFamily: 'Cairo_400Regular',
    flex: 1,
    textAlign: 'center',
    marginRight: 44,
  },
  notAuthContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notAuthText: {
    fontSize: 18,
    color: Colors.BYellow,
    fontFamily: 'Cairo_400Regular',
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: Colors.BYellow,
    borderRadius: 8,
    padding: 15,
    paddingHorizontal: 30,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.DGreen,
    fontFamily: 'Cairo_400Regular',
  },
  userInfo: {
    backgroundColor: Colors.DGreen,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.BYellow,
    fontFamily: 'Cairo_400Regular',
    textAlign: 'center',
  },
  contributionsCount: {
    fontSize: 14,
    color: Colors.BGreen,
    fontFamily: 'Cairo_400Regular',
    textAlign: 'center',
    marginTop: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.BYellow,
    borderRadius: 8,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: Colors.DGreen,
    fontFamily: 'Cairo_400Regular',
  },
  searchIcon: {
    marginRight: 15,
  },
  sectionTitle: {
    fontSize: 16,
    color: Colors.BYellow,
    fontFamily: 'Cairo_400Regular',
    marginBottom: 10,
    textAlign: 'right',
  },
  zikrList: {
    maxHeight: 200,
  },
  zikrItem: {
    backgroundColor: Colors.DGreen,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.BGreen,
  },
  selectedZikrItem: {
    backgroundColor: Colors.BGreen,
    borderColor: Colors.BYellow,
    borderWidth: 2,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.BYellow,
    fontFamily: 'Cairo_400Regular',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  zikrText: {
    fontSize: 12,
    color: Colors.BYellow,
    fontFamily: 'Cairo_400Regular',
    marginTop: 5,
    textAlign: 'right',
  },
  checkIcon: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  translationContainer: {
    backgroundColor: Colors.DGreen,
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
  },
  selectedZikrTitle: {
    fontSize: 16,
    color: Colors.BYellow,
    fontFamily: 'Cairo_400Regular',
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'right',
  },
  selectedZikrText: {
    fontSize: 14,
    color: Colors.BYellow,
    fontFamily: 'Cairo_400Regular',
    marginBottom: 15,
    textAlign: 'right',
    backgroundColor: Colors.BGreen,
    padding: 10,
    borderRadius: 5,
  },
  translationLabel: {
    fontSize: 16,
    color: Colors.BYellow,
    fontFamily: 'Cairo_400Regular',
    marginBottom: 5,
  },
  translationInput: {
    backgroundColor: Colors.BYellow,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: Colors.DGreen,
    fontFamily: 'Cairo_400Regular',
    minHeight: 80,
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: Colors.BYellow,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.DGreen,
    fontFamily: 'Cairo_400Regular',
  },
});

export default ContributionScreen;