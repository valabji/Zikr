# Azkar View Mode Feature

## Overview

The Azkar View Mode feature allows users to choose between two different ways to view and interact with Azkar content:

1. **Swiper Mode (Page by Page)** - Traditional swiper interface where each Zikr is displayed on a separate page
2. **One Page Scroll Mode** - All Azkar are displayed in a single scrollable page

## Implementation Details

### Components Created

1. **AzkarSwiper.js** - Extracted swiper logic from Screen2.js
   - Handles swiper functionality for both web and mobile platforms
   - Maintains the original page-by-page navigation
   - Includes RTL support and automatic progression after completing counts

2. **AzkarOnePageScroll.js** - New component for continuous scroll
   - Displays all Azkar in a single scrollable view
   - Each Zikr maintains its own counter
   - Better for users who prefer to see all content at once

### Settings Integration

The view mode setting has been added to the Settings screen with:
- Dropdown selection between "Swiper (Page by Page)" and "One Page Scroll"
- Persistent storage using AsyncStorage
- Proper localization for both Arabic and English
- Default setting of "swiper" for existing users

### Storage

The view mode preference is stored in AsyncStorage with the key `@viewMode` and can have values:
- `"swiper"` (default)
- `"onePageScroll"`

### Localization

New translation keys added:
- `settings.viewMode` - "Azkar View Mode" / "طريقة عرض الأذكار"
- `settings.swiper` - "Swiper (Page by Page)" / "التمرير (صفحة بصفحة)"
- `settings.onePageScroll` - "One Page Scroll" / "التمرير المستمر"

## Benefits

1. **User Choice** - Users can choose the interface that works best for them
2. **Accessibility** - One page scroll can be easier for some users to navigate
3. **Performance** - One page scroll doesn't require complex swiper logic
4. **Backwards Compatibility** - Existing users maintain the familiar swiper interface by default

## Usage

Users can change the view mode by:
1. Going to Settings
2. Finding "Azkar View Mode" setting
3. Selecting their preferred mode from the dropdown
4. Saving settings

The change takes effect immediately when navigating to any Azkar category screen.
