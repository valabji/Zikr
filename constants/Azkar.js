import Azkar from './Azkar.json';
import ZikrTranslations from './ZikrTranslations.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

let zikr = global.zikr
zikr = zikr != undefined ? JSON.parse(zikr) : Azkar

// Function to merge user contributions with base translations
const mergeTranslations = async () => {
  try {
    const contributions = await AsyncStorage.getItem('@contributions');
    const approvedTranslations = {};
    
    if (contributions) {
      const parsedContributions = JSON.parse(contributions);
      parsedContributions
        .filter(c => c.status === 'approved')
        .forEach(contribution => {
          if (!approvedTranslations[contribution.zikrId]) {
            approvedTranslations[contribution.zikrId] = {};
          }
          if (!approvedTranslations[contribution.zikrId][contribution.language]) {
            approvedTranslations[contribution.zikrId][contribution.language] = {};
          }
          approvedTranslations[contribution.zikrId][contribution.language] = {
            text: contribution.translation,
            description: contribution.description || '',
            contributor: contribution.userName
          };
        });
    }
    
    return { ...ZikrTranslations.translations, ...approvedTranslations };
  } catch (error) {
    console.error('Error merging translations:', error);
    return ZikrTranslations.translations;
  }
};

// Function to get translation for a zikr
export const getZikrTranslation = async (zikrText, language = 'en') => {
  const allTranslations = await mergeTranslations();
  return allTranslations[zikrText]?.[language] || null;
};

export default zikr