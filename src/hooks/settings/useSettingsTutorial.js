import { useState, useEffect, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { t } from '@/locales/i18n';
import { SPACING } from '@/constants/settingsTokens';
import { useAudio } from '@/utils/audio/Sounds';

export function useSettingsTutorial({ showVibration, currentLang, scrollViewRef }) {
  const { playClick } = useAudio();
  const [isTutorialVisible, setTutorialVisible] = useState(false);
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [highlightVisible, setHighlightVisible] = useState(false);
  const targetY = useRef({});
  const tutorialProgress = useSharedValue(0);

  const tutorialSteps = useMemo(() => [
    { key: 'language', title: t('settings.language'), description: t('settings.tutorial.language') },
    { key: 'autoSave', title: t('settings.autoSave'), description: t('settings.tutorial.autoSave') },
    { key: 'theme', title: t('settings.theme'), description: t('settings.tutorial.theme') },
    { key: 'initialScreen', title: t('settings.initialScreen'), description: t('settings.tutorial.initialScreen') },
    { key: 'viewMode', title: t('settings.viewMode'), description: t('settings.tutorial.viewMode') },
    ...(showVibration ? [
      { key: 'vibrationTasbih', title: t('settings.vibrationTasbih'), description: t('settings.tutorial.vibrationTasbih') },
      { key: 'vibrationAzkar', title: t('settings.vibrationAzkar'), description: t('settings.tutorial.vibrationAzkar') },
      { key: 'vibrationIntensity', title: t('settings.vibrationIntensity'), description: t('settings.tutorial.vibrationIntensity') }
    ] : []),
    { key: 'clickVolume', title: t('settings.clickVolume'), description: t('settings.tutorial.clickVolume') },
    { key: 'fontSize', title: t('settings.fontSize'), description: t('settings.tutorial.fontSize') },
  ], [showVibration, currentLang]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${((currentTutorialStep + 1) / tutorialSteps.length) * 100}%`,
  }));

  useEffect(() => {
    tutorialProgress.value = withTiming((currentTutorialStep + 1) / tutorialSteps.length, { duration: 300 });
  }, [currentTutorialStep]);

  useEffect(() => {
    if (isTutorialVisible && !isAnimating && currentTutorialStep < tutorialSteps.length) {
      const timer = setTimeout(() => {
        startTutorialAnimation();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentTutorialStep, isTutorialVisible]);

  const scrollToSetting = (settingKey) => {
    const y = targetY.current[settingKey];
    if (isTutorialVisible && scrollViewRef.current && y !== undefined) {
      scrollViewRef.current.scrollTo({ y: Math.max(y - SPACING.md, 0), animated: true });
    }
  };

  const startTutorialAnimation = () => {
    try {
      if (!isTutorialVisible || currentTutorialStep >= tutorialSteps.length) return;
      setIsAnimating(true);
      setHighlightVisible(true);
      setTimeout(() => {
        setHighlightVisible(false);
        setIsAnimating(false);
      }, 500);
    } catch (error) {
      setIsAnimating(false);
      setHighlightVisible(false);
    }
  };

  const nextTutorialStep = () => {
    if (isTutorialVisible && currentTutorialStep < tutorialSteps.length - 1) {
      const nextStep = currentTutorialStep + 1;
      setCurrentTutorialStep(nextStep);
      const nextStepKey = tutorialSteps[nextStep]?.key;
      if (nextStepKey) {
        setTimeout(() => scrollToSetting(nextStepKey), 100);
      }
    }
  };

  const previousTutorialStep = () => {
    if (currentTutorialStep > 0) {
      const prevStep = currentTutorialStep - 1;
      setCurrentTutorialStep(prevStep);
      const prevStepKey = tutorialSteps[prevStep]?.key;
      if (prevStepKey) {
        setTimeout(() => scrollToSetting(prevStepKey), 100);
      }
    }
  };

  const openTutorial = () => {
    playClick();
    setTutorialVisible(true);
    setCurrentTutorialStep(0);
    setTimeout(() => startTutorialAnimation(), 300);
  };

  const closeTutorial = () => {
    setTutorialVisible(false);
    setCurrentTutorialStep(0);
    setIsAnimating(false);
    setHighlightVisible(false);
    tutorialProgress.value = 0;

    if (scrollViewRef.current) {
      try {
        if (Platform.OS === 'web') {
          const scrollElement = scrollViewRef.current.getScrollableNode
            ? scrollViewRef.current.getScrollableNode()
            : scrollViewRef.current;
          if (scrollElement && scrollElement.scrollTo) {
            scrollElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
          } else if (scrollElement && scrollElement.scrollTop !== undefined) {
            scrollElement.scrollTop = 0;
          }
        } else {
          scrollViewRef.current.scrollTo({ y: 0, animated: true });
        }
      } catch (error) {
        console.warn('Error scrolling to top:', error);
      }
    }
  };

  const registerTarget = (key) => (e) => { targetY.current[key] = e.nativeEvent.layout.y; };

  return {
    isTutorialVisible,
    currentTutorialStep,
    tutorialSteps,
    highlightVisible,
    animatedProgressStyle,
    openTutorial,
    closeTutorial,
    nextTutorialStep,
    previousTutorialStep,
    registerTarget,
  };
}
