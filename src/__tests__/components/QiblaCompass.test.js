import React from 'react';
import { render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import QiblaCompass from '@/components/qibla/QiblaCompass';

const makeRotation = (val = 0) => new Animated.Value(val);

describe('QiblaCompass', () => {
  it('renders without crashing in disabled state', () => {
    const tree = render(
      <QiblaCompass
        qiblaDirection={137}
        isQiblaAligned={false}
        isQiblaClose={false}
        compassEnabled={false}
        compassRotationValue={makeRotation()}
        rotationValue={makeRotation()}
      />
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('renders without crashing when enabled and aligned', () => {
    const tree = render(
      <QiblaCompass
        qiblaDirection={137}
        isQiblaAligned
        isQiblaClose={false}
        compassEnabled
        compassRotationValue={makeRotation()}
        rotationValue={makeRotation()}
        currentAngleDifference={0.5}
      />
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('renders without crashing when close (yellow state)', () => {
    const tree = render(
      <QiblaCompass
        qiblaDirection={137}
        isQiblaAligned={false}
        isQiblaClose
        compassEnabled
        compassRotationValue={makeRotation()}
        rotationValue={makeRotation()}
        currentAngleDifference={5}
      />
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('renders without crashing when far (orange state)', () => {
    const tree = render(
      <QiblaCompass
        qiblaDirection={137}
        isQiblaAligned={false}
        isQiblaClose={false}
        compassEnabled
        compassRotationValue={makeRotation()}
        rotationValue={makeRotation()}
        currentAngleDifference={45}
      />
    );
    expect(tree.toJSON()).toBeTruthy();
  });
});
