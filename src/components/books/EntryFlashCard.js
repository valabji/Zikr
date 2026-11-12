import * as React from 'react';
import { Animated } from 'react-native';

export default function EntryFlashCard({ active, baseColor, flashColor, style, children }) {
  const anim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (!active) return;
    anim.setValue(1);
    Animated.timing(anim, { toValue: 0, duration: 900, delay: 350, useNativeDriver: false }).start();
  }, [active, anim]);
  return (
    <Animated.View style={[style, { backgroundColor: anim.interpolate({ inputRange: [0, 1], outputRange: [baseColor, flashColor] }) }]}>
      {children}
    </Animated.View>
  );
}
