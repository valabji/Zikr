import * as React from 'react';
import { View } from 'react-native';
import { isRTL } from '@/locales/i18n';
import { PageView, PageViewContinuous } from './MushafPage';

export default function MushafListItem({ item, isPaired, isContinuous, fitEnabled, windowWidth, maxWidthForFit, sharedProps }) {
  if (isPaired) {
    const basePageWidth = windowWidth / 2;
    const effectivePageWidth = fitEnabled ? Math.min(basePageWidth, maxWidthForFit) : basePageWidth;
    const makeSlot = (pageData) => (
      <View style={{ flex: 1, alignItems: 'center' }}>
        {pageData && <PageView page={pageData} pageWidth={effectivePageWidth} {...sharedProps} />}
      </View>
    );
    const leftSlot = makeSlot(item.leftPage);
    const rightSlot = makeSlot(item.rightPage);
    return (
      <View style={{ width: windowWidth, flex: 1, flexDirection: 'row' }}>
        {isRTL() ? rightSlot : leftSlot}
        {isRTL() ? leftSlot : rightSlot}
      </View>
    );
  }
  if (!isContinuous) {
    const effectivePageWidth = fitEnabled ? Math.min(windowWidth, maxWidthForFit) : windowWidth;
    return (
      <View style={{ width: windowWidth, flex: 1, alignItems: 'center' }}>
        <PageView page={item} pageWidth={effectivePageWidth} {...sharedProps} />
      </View>
    );
  }
  return <PageViewContinuous page={item} {...sharedProps} />;
}
