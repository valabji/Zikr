#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script to automatically update version numbers in app.config.js
 * Updates both expo.version (semantic version) and expo.android.versionCode (build number)
 * Automatically detects appropriate version increment based on git changes
 */

const CONFIG_FILE = './app.config.js';
const PACKAGE_FILE = './package.json';

function incrementVersion(version) {
  const parts = version.split('.');
  if (parts.length !== 3) {
    throw new Error(`Invalid version format: ${version}. Expected x.y.z format.`);
  }
  
  const [major, minor, patch] = parts.map(Number);
  
  // Increment patch version by default
  // You can modify this logic to increment major/minor versions as needed
  return `${major}.${minor}.${patch + 1}`;
}

function updateVersionInConfig() {
  try {
    // Read the config file
    if (!fs.existsSync(CONFIG_FILE)) {
      throw new Error(`Config file not found: ${CONFIG_FILE}`);
    }

    const configContent = fs.readFileSync(CONFIG_FILE, 'utf8');
    
    // Extract current version using regex
    const versionMatch = configContent.match(/version:\s*["']([^"']+)["']/);
    const versionCodeMatch = configContent.match(/versionCode:\s*(\d+)/);
    
    if (!versionMatch) {
      throw new Error('Could not find version in config file');
    }
    
    if (!versionCodeMatch) {
      throw new Error('Could not find versionCode in config file');
    }
    
    const currentVersion = versionMatch[1];
    const currentVersionCode = parseInt(versionCodeMatch[1]);
    
    console.log(`Current version: ${currentVersion}`);
    console.log(`Current versionCode: ${currentVersionCode}`);
    
    // Calculate new versions
    const newVersion = incrementVersion(currentVersion);
    const newVersionCode = currentVersionCode + 1;
    
    console.log(`New version: ${newVersion}`);
    console.log(`New versionCode: ${newVersionCode}`);
    
    // Update the config content
    let updatedContent = configContent;
    
    // Replace version
    updatedContent = updatedContent.replace(
      /version:\s*["']([^"']+)["']/,
      `version: "${newVersion}"`
    );
    
    // Replace versionCode
    updatedContent = updatedContent.replace(
      /versionCode:\s*\d+/,
      `versionCode: ${newVersionCode}`
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(CONFIG_FILE, updatedContent, 'utf8');
    
    console.log('\n✅ Successfully updated version numbers!');
    console.log(`   Version: ${currentVersion} → ${newVersion}`);
    console.log(`   Version Code: ${currentVersionCode} → ${newVersionCode}`);
    
  } catch (error) {
    console.error('❌ Error updating version:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments for custom version increment
function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node versioning.js [options]

Options:
  --major, -M    Increment major version (x.0.0)
  --minor, -m    Increment minor version (x.y.0)
  --patch, -p    Increment patch version (x.y.z) [default]
  --auto, -a     Auto-detect version increment based on git changes [default]
  --no-auto      Disable auto-detection, use explicit version type
  --preview      Show preview without making changes
  --help, -h     Show this help message

Updates both app.config.js and package.json version fields automatically.

Auto-detection rules:
  - No changes: No increment
  - Version manually updated: No increment (version already changed)
  - Version not manually updated: Patch increment (any other changes)

Examples:
  node versioning.js            # Auto-detect: patch if changes, none if no changes
  node versioning.js --preview  # Show preview without updating
  node versioning.js --auto     # Same as first example
  node versioning.js --patch    # Force patch increment
  node versioning.js --minor    # Force minor increment
  node versioning.js --major    # Force major increment
`);
    process.exit(0);
  }
  
  const hasExplicitType = args.some(arg => ['--major', '-M', '--minor', '-m', '--patch', '-p'].includes(arg));
  const noAuto = args.includes('--no-auto');
  const autoDetect = args.includes('--auto') || args.includes('-a') || (!hasExplicitType && !noAuto);
  const previewOnly = args.includes('--preview');
  
  return {
    major: args.includes('--major') || args.includes('-M'),
    minor: args.includes('--minor') || args.includes('-m'),
    patch: args.includes('--patch') || args.includes('-p'),
    auto: autoDetect,
    noAuto: noAuto,
    preview: previewOnly
  };
}

/**
 * Check if version has been manually updated in app.config.js
 */
function hasManualVersionUpdate() {
  try {
    // Get the diff for app.config.js
    const configDiff = execSync('git diff HEAD app.config.js', { encoding: 'utf8' }).trim();
    
    if (!configDiff) {
      // No changes to app.config.js
      return false;
    }
    
    // Check if the diff contains version-related changes
    const hasVersionChange = configDiff.includes('version:') || configDiff.includes('versionCode:');
    
    return hasVersionChange;
    
  } catch (error) {
    // If we can't get the diff, assume no manual version update
    return false;
  }
}

/**
 * Check git status and determine if version should be incremented
 */
function analyzeGitChanges() {
  try {
    // Check if we're in a git repository
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    
    // Get all changes (staged, unstaged, and untracked)
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();
    const unstagedFiles = execSync('git diff --name-only', { encoding: 'utf8' }).trim();
    const untrackedFiles = execSync('git ls-files --others --exclude-standard', { encoding: 'utf8' }).trim();
    
    const allChangedFiles = [...new Set([
      ...stagedFiles.split('\n').filter(f => f),
      ...unstagedFiles.split('\n').filter(f => f),
      ...untrackedFiles.split('\n').filter(f => f)
    ])];
    
    console.log('🔍 Analyzing git changes...');
    
    if (allChangedFiles.length === 0) {
      console.log('   No git changes detected');
      return { type: 'none', reason: 'No changes detected' };
    }
    
    console.log(`   Found ${allChangedFiles.length} changed file(s):`);
    allChangedFiles.forEach(file => console.log(`     - ${file}`));
    
    // Check if version has been manually updated
    const manualVersionUpdate = hasManualVersionUpdate();
    
    if (manualVersionUpdate) {
      console.log('   Version has been manually updated');
      return { type: 'none', reason: 'Version manually updated - no auto increment needed' };
    }
    
    // If no manual version update, do patch increment
    console.log('   Version not manually updated, defaulting to patch increment');
    return { type: 'patch', reason: 'Version not manually updated - applying patch increment' };
    
  } catch (error) {
    console.log('   Not in a git repository or git not available');
    return { type: 'patch', reason: 'Default to patch (no git)' };
  }
}

// Enhanced version increment with major/minor support
function incrementVersionAdvanced(version, type) {
  const parts = version.split('.');
  if (parts.length !== 3) {
    throw new Error(`Invalid version format: ${version}. Expected x.y.z format.`);
  }
  
  let [major, minor, patch] = parts.map(Number);
  
  if (type.major) {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (type.minor) {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }
  
  return `${major}.${minor}.${patch}`;
}

/**
 * Show preview of version information and potential updates
 */
function showVersionPreview() {
  try {
    const configContent = fs.readFileSync(CONFIG_FILE, 'utf8');
    const packageContent = fs.readFileSync(PACKAGE_FILE, 'utf8');
    
    const versionMatch = configContent.match(/version:\s*["']([^"']+)["']/);
    const versionCodeMatch = configContent.match(/versionCode:\s*(\d+)/);
    const packageVersionMatch = packageContent.match(/("name":\s*"[^"]+",\s*"version":\s*)"([^"]+)"/);
    
    if (!versionMatch || !versionCodeMatch) {
      throw new Error('Could not find version information in app.config.js');
    }

    if (!packageVersionMatch) {
      throw new Error('Could not find version information in package.json');
    }
    
    const currentVersion = versionMatch[1];
    const currentVersionCode = parseInt(versionCodeMatch[1]);
    const currentPackageVersion = packageVersionMatch[2]; // Note: using index 2 because we captured the prefix
    
    console.log('📊 Current Version Information:');
    console.log(`   app.config.js version: ${currentVersion}`);
    console.log(`   package.json version: ${currentPackageVersion}`);
    console.log(`   expo.android.versionCode: ${currentVersionCode}`);
    console.log('');
    
    // Show git analysis
    console.log('🔍 Git Change Analysis:');
    const gitAnalysis = analyzeGitChanges();
    console.log(`   Status: ${gitAnalysis.reason}`);
    
    // Get all changed files for display
    try {
      const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();
      const unstagedFiles = execSync('git diff --name-only', { encoding: 'utf8' }).trim();
      const untrackedFiles = execSync('git ls-files --others --exclude-standard', { encoding: 'utf8' }).trim();
      
      const allChangedFiles = [...new Set([
        ...stagedFiles.split('\n').filter(f => f),
        ...unstagedFiles.split('\n').filter(f => f),
        ...untrackedFiles.split('\n').filter(f => f)
      ])];
      
      if (allChangedFiles.length > 0) {
        console.log(`   Changed files (${allChangedFiles.length}):`);
        allChangedFiles.slice(0, 5).forEach(file => console.log(`     - ${file}`));
        if (allChangedFiles.length > 5) {
          console.log(`     ... and ${allChangedFiles.length - 5} more`);
        }
      }
    } catch (error) {
      // Git not available, skip file listing
    }
    
    console.log(`   Auto-detected increment: ${gitAnalysis.type === 'none' ? 'None (no changes needed)' : gitAnalysis.type}`);
    console.log('');
    
    console.log('🔮 Preview of version updates:');
    
    const parts = currentVersion.split('.');
    const [major, minor, patch] = parts.map(Number);
    
    const autoSuffix = gitAnalysis.type !== 'none' ? ` ← Auto-detected` : '';
    
    console.log(`   Patch increment: ${currentVersion} → ${major}.${minor}.${patch + 1} (versionCode: ${currentVersionCode + 1})${gitAnalysis.type === 'patch' ? autoSuffix : ''}`);
    console.log(`   Minor increment: ${currentVersion} → ${major}.${minor + 1}.0 (versionCode: ${currentVersionCode + 1})${gitAnalysis.type === 'minor' ? autoSuffix : ''}`);
    console.log(`   Major increment: ${currentVersion} → ${major + 1}.0.0 (versionCode: ${currentVersionCode + 1})${gitAnalysis.type === 'major' ? autoSuffix : ''}`);
    
    if (gitAnalysis.type === 'none') {
      console.log('');
      console.log('💡 No increment recommended based on current changes.');
      console.log('   Use explicit flags (--patch, --minor, --major) to force an increment.');
    }
    
  } catch (error) {
    console.error('❌ Error reading version:', error.message);
  }
}

// Update the main function to use advanced version increment with git analysis
function updateVersionInConfigAdvanced() {
  try {
    const args = parseArgs();
    
    // If preview mode, show preview and exit
    if (args.preview) {
      showVersionPreview();
      return;
    }
    
    // Determine version increment type
    let versionType = { major: false, minor: false, patch: false };
    let incrementReason = '';
    
    if (args.auto && !args.noAuto) {
      // Auto-detect based on git changes
      const gitAnalysis = analyzeGitChanges();
      
      if (gitAnalysis.type === 'none') {
        console.log(`📋 ${gitAnalysis.reason}`);
        console.log('💡 No version increment needed. Use --patch to force increment.');
        return;
      }
      
      versionType[gitAnalysis.type] = true;
      incrementReason = `Auto-detected: ${gitAnalysis.reason}`;
    } else {
      // Use explicit version type or default to patch
      if (args.major) {
        versionType.major = true;
        incrementReason = 'Explicit: Major version increment requested';
      } else if (args.minor) {
        versionType.minor = true;
        incrementReason = 'Explicit: Minor version increment requested';
      } else {
        versionType.patch = true;
        incrementReason = 'Explicit: Patch version increment (default)';
      }
    }
    
    console.log(`📈 ${incrementReason}`);
    
    // Read the config file
    if (!fs.existsSync(CONFIG_FILE)) {
      throw new Error(`Config file not found: ${CONFIG_FILE}`);
    }

    if (!fs.existsSync(PACKAGE_FILE)) {
      throw new Error(`Package file not found: ${PACKAGE_FILE}`);
    }

    const configContent = fs.readFileSync(CONFIG_FILE, 'utf8');
    const packageContent = fs.readFileSync(PACKAGE_FILE, 'utf8');
    
    // Extract current version using regex
    const versionMatch = configContent.match(/version:\s*["']([^"']+)["']/);
    const versionCodeMatch = configContent.match(/versionCode:\s*(\d+)/);
    const packageVersionMatch = packageContent.match(/("name":\s*"[^"]+",\s*"version":\s*)"([^"]+)"/);
    
    if (!versionMatch) {
      throw new Error('Could not find version in config file');
    }
    
    if (!versionCodeMatch) {
      throw new Error('Could not find versionCode in config file');
    }

    if (!packageVersionMatch) {
      throw new Error('Could not find version in package.json');
    }
    
    const currentVersion = versionMatch[1];
    const currentVersionCode = parseInt(versionCodeMatch[1]);
    const currentPackageVersion = packageVersionMatch[2]; // Note: using index 2 because we captured the prefix
    
    console.log(`Current app.config.js version: ${currentVersion}`);
    console.log(`Current package.json version: ${currentPackageVersion}`);
    console.log(`Current versionCode: ${currentVersionCode}`);
    
    // Calculate new versions
    const newVersion = incrementVersionAdvanced(currentVersion, versionType);
    const newVersionCode = currentVersionCode + 1;
    
    const incrementType = versionType.major ? 'major' : versionType.minor ? 'minor' : 'patch';
    console.log(`Incrementing ${incrementType} version...`);
    console.log(`New version: ${newVersion}`);
    console.log(`New versionCode: ${newVersionCode}`);
    
    // Update the config content
    let updatedConfigContent = configContent;
    
    // Replace version in app.config.js
    updatedConfigContent = updatedConfigContent.replace(
      /version:\s*["']([^"']+)["']/,
      `version: "${newVersion}"`
    );
    
    // Replace versionCode in app.config.js
    updatedConfigContent = updatedConfigContent.replace(
      /versionCode:\s*\d+/,
      `versionCode: ${newVersionCode}`
    );

    // Update the package.json content
    let updatedPackageContent = packageContent;
    
    // Replace version in package.json
    updatedPackageContent = updatedPackageContent.replace(
      /("name":\s*"[^"]+",\s*"version":\s*)"([^"]+)"/,
      `$1"${newVersion}"`
    );
    
    // Write the updated content back to both files
    fs.writeFileSync(CONFIG_FILE, updatedConfigContent, 'utf8');
    fs.writeFileSync(PACKAGE_FILE, updatedPackageContent, 'utf8');
    
    console.log('\n✅ Successfully updated version numbers!');
    console.log(`   app.config.js version: ${currentVersion} → ${newVersion}`);
    console.log(`   package.json version: ${currentPackageVersion} → ${newVersion}`);
    console.log(`   Version Code: ${currentVersionCode} → ${newVersionCode}`);
    
  } catch (error) {
    console.error('❌ Error updating version:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  updateVersionInConfigAdvanced();
}

module.exports = {
  incrementVersion,
  incrementVersionAdvanced,
  updateVersionInConfigAdvanced
};
