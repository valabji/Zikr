# FolderStructureAgent Guidelines

## Objective
Reorganize the Zikr app codebase into a clear, feature-based structure that improves maintainability and scalability.

## New Directory Structure
```
src/
├── features/           # Feature-based modules
│   ├── azkar/         # Azkar/Prayer related features
│   │   ├── components/
│   │   ├── screens/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── store.js   
│   ├── qibla/         # Qibla compass feature
│   ├── settings/      # App settings
│   └── shared/        # Shared features
├── core/              # Core application code
│   ├── navigation/    
│   ├── theme/         
│   ├── i18n/         
│   └── store/        
├── common/            # Shared utilities and components
│   ├── components/    
│   ├── hooks/        
│   └── utils/        
└── assets/           # Static assets
    ├── fonts/
    ├── images/
    └── sounds/
```

## File Movement Strategy

### 1. Feature Modules Migration
- Move related components, screens, and utilities into respective feature folders
- Keep feature-specific code isolated within its module
- Document dependencies between features

#### Azkar Feature
- Move from: `/screens/MainScreen.js`, `/screens/Screen2.js`
- To: `src/features/azkar/screens/`
- Include related components and utilities

#### Qibla Feature
- Move from: `/screens/QiblaScreen.js`, `/components/QiblaCompass.js`
- To: `src/features/qibla/`
- Include compass-related utilities and hooks

#### Settings Feature
- Move from: `/screens/SettingsScreen.js`, `/screens/UnifiedPrayerSettingsScreen.js`
- To: `src/features/settings/`

### 2. Core Application Migration
- Centralize navigation configuration
- Move theme and i18n setup
- Restructure store configuration

### 3. Common Code Migration
- Identify truly shared components
- Move reusable hooks and utilities
- Document shared code guidelines

### 4. Asset Organization
- Centralize all static assets
- Maintain clear categorization
- Update import paths

## Naming Conventions

### Directories
- Feature modules: Singular, lowercase (e.g., `azkar`, `qibla`)
- Core modules: Singular, lowercase (e.g., `navigation`, `theme`)
- Component directories: Plural, lowercase (e.g., `components`, `utils`)

### Files
- Components: PascalCase (e.g., `QiblaCompass.js`)
- Utilities: camelCase (e.g., `prayerUtils.js`)
- Constants: SNAKE_CASE (e.g., `PRAYER_CONSTANTS.js`)
- Feature stores: `store.js` within feature directory

## Implementation Guidelines

1. Create new directory structure first
2. Move files one feature at a time
3. Update import paths progressively
4. Verify each feature works after migration
5. Clean up old directories last

## Testing Strategy

1. Maintain test file structure parallel to source
2. Update test imports as files move
3. Run tests after each feature migration
4. Document any test modifications needed

## Success Criteria

- [ ] All files organized by feature
- [ ] Clear separation of concerns
- [ ] No circular dependencies
- [ ] All tests passing
- [ ] Import paths updated
- [ ] Documentation updated