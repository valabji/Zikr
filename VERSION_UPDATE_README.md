# Versioning Script

This script automatically updates version numbers in `app.config.js` for your Expo React Native app. It includes intelligent git change detection to automatically determine when version increments are needed and provides preview functionality.

## Files Created

- `versioning.js` - Unified script that handles both preview and version updates with git analysis

## Usage

### Using npm/yarn scripts (recommended):

```bash
# Auto-detect version increment based on git changes
yarn version
# or
npm run version

# Preview what would happen without making changes
yarn version:preview
# or
npm run version:preview

# Force specific increments
yarn version:patch   # Force patch increment
yarn version:minor   # Force minor increment  
yarn version:major   # Force major increment
```

### Using the script directly:

```bash
# Auto-detect version increment (default)
node versioning.js

# Preview without making changes
node versioning.js --preview

# Force specific increments
node versioning.js --patch
node versioning.js --minor
node versioning.js --major

# Show help
node versioning.js --help
```

## Auto-Detection Logic

The script analyzes your git changes to determine if a version increment is needed:

- **No changes detected**: No version increment
- **Version manually updated**: No version increment (assumes you already updated the version intentionally)
- **Version not manually updated**: Patch increment (applies to any other file changes)

This ensures that:
1. If you manually update the version in `app.config.js`, the script won't auto-increment it again
2. If you have code changes but haven't updated the version, it will auto-increment with a patch
3. If there are no changes, it does nothing

You can always override the auto-detection by using explicit flags (`--patch`, `--minor`, `--major`).

## What it updates

The script updates two values in `app.config.js`:

1. **`expo.version`** - The semantic version string (e.g., "1.1.6")
2. **`expo.android.versionCode`** - The Android build number (e.g., 9)

## Version increment rules

- **Patch**: Increments the last number (bug fixes, small updates)
- **Minor**: Increments the middle number, resets patch to 0 (new features)
- **Major**: Increments the first number, resets minor and patch to 0 (breaking changes)
- **Version Code**: Always increments by 1 regardless of version type

## Current Status

Current version: **1.1.6** (versionCode: 9)

## Example Output

### Preview mode:
```
📊 Current Version Information:
   expo.version: 1.1.7
   expo.android.versionCode: 10

🔍 Git Change Analysis:
   Status: Changes detected, using patch increment
   Changed files (3):
     - src/components/NewComponent.js
     - src/screens/UpdatedScreen.js
     - utils/helpers.js
   Auto-detected increment: patch

🔮 Preview of version updates:
   Patch increment: 1.1.7 → 1.1.8 (versionCode: 11) ← Auto-detected
   Minor increment: 1.1.7 → 1.2.0 (versionCode: 11)
   Major increment: 1.1.7 → 2.0.0 (versionCode: 11)
```

### Auto-detection with changes:
```
🔍 Analyzing git changes...
   Found 3 changed file(s):
     - src/components/NewComponent.js
     - src/screens/UpdatedScreen.js
     - utils/helpers.js
   Non-version files changed, defaulting to patch increment
📈 Auto-detected: Changes detected, using patch increment
Current version: 1.1.7
Current versionCode: 10
Incrementing patch version...
New version: 1.1.8
New versionCode: 11

✅ Successfully updated version numbers!
   Version: 1.1.7 → 1.1.8
   Version Code: 10 → 11
```

### Auto-detection with only version changes:
```
🔍 Analyzing git changes...
   Found 1 changed file(s):
     - app.config.js
   Only version changes detected in app.config.js
📋 Only version changes detected
💡 No version increment needed. Use --patch to force increment.
```

## Safety Features

- Validates version format before updating
- Analyzes git changes to prevent unnecessary increments
- Shows clear before/after information
- Exits with error code if anything goes wrong
- Provides override options for manual control
