#!/usr/bin/env node

/**
 * publish.js - Script to check package versions, build, and publish packages
 * 
 * This script:
 * 1. Checks that all packages have the same version
 * 2. Builds all packages (ensuring core is embedded)
 * 3. Publishes the packages to npm
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Configuration
const ROOT_DIR = path.resolve(__dirname);
const PACKAGES = [
  'libs/react-lazy-virtual-scroll',
  'libs/vue-lazy-virtual-scroll'
];

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Execute a command and log its output
 * @param {string} command - The command to execute
 * @param {string} workingDir - The directory to execute the command in (optional)
 */
function runCommand(command, workingDir = ROOT_DIR) {
  console.log(`📋 Running: ${command}`);
  try {
    execSync(command, { 
      cwd: workingDir, 
      stdio: 'inherit' 
    });
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error);
    process.exit(1);
  }
}

/**
 * Get package info from package.json
 * @param {string} packagePath - Path to the package directory
 * @returns {Object} Package info including name and version
 */
function getPackageInfo(packagePath) {
  const packageJsonPath = path.join(ROOT_DIR, packagePath, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error(`❌ Error: ${packageJsonPath} does not exist.`);
    process.exit(1);
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return {
      name: packageJson.name,
      version: packageJson.version
    };
  } catch (error) {
    console.error(`❌ Error reading or parsing ${packageJsonPath}`);
    console.error(error);
    process.exit(1);
  }
}

/**
 * Check that all packages have the same version
 * @returns {string} The common version if all match
 */
function checkVersions() {
  console.log('🔍 Checking package versions...');
  
  let firstVersion = null;
  let firstName = null;
  
  for (const packagePath of [...PACKAGES, 'libs/core']) {
    const { name, version } = getPackageInfo(packagePath);
    
    if (firstVersion === null) {
      firstVersion = version;
      firstName = name;
      console.log(`ℹ️ First package: ${name} @ v${version}`);
    } else {
      if (version !== firstVersion) {
        console.error('❌ Version mismatch!');
        console.error(`  ${firstName}: ${firstVersion}`);
        console.error(`  ${name}: ${version}`);
        console.error('Please make sure all packages have the same version.');
        process.exit(1);
      } else {
        console.log(`✅ ${name}: v${version}`);
      }
    }
  }
  
  console.log(`✅ All packages have the same version: v${firstVersion}`);
  return firstVersion;
}

/**
 * Build all packages
 */
function buildPackages() {
  console.log('🏗️ Building packages...');
  
  // Build the libraries
  runCommand('npm run build:react');
  runCommand('npm run build:vue');
}

/**
 * Publish packages to npm
 * @param {string} version - The version to publish
 */
function publishPackages(version) {
  console.log('📦 Publishing packages...');
  
  for (const packagePath of [...PACKAGES, 'libs/core']) {
    const distPath = `dist/${packagePath}`;
    const { name } = getPackageInfo(packagePath);
    
    console.log(`📦 Publishing ${name}...`);
    
    try {
      runCommand('npm publish --access public', path.join(ROOT_DIR, distPath));
      console.log(`✅ Published ${name}@${version}`);
    } catch (error) {
      console.error(`❌ Failed to publish ${name}`);
      console.error(error);
      process.exit(1);
    }
  }
  
  console.log('🎉 All packages published successfully!');
}

/**
 * Main function
 */
async function main() {
  try {
    // Check versions
    const version = checkVersions();
    
    // Ask for confirmation
    console.log('');
    console.log(`🚀 Ready to publish packages with version v${version}`);
    
    rl.question('Do you want to continue? (y/n) ', (answer) => {
      if (answer.toLowerCase() !== 'y') {
        console.log('❌ Publish canceled.');
        rl.close();
        return;
      }
      
      // Continue with build and publish
      buildPackages();
      publishPackages(version);
      
      rl.close();
    });
  } catch (error) {
    console.error('❌ An error occurred during the publish process:');
    console.error(error);
    process.exit(1);
  }
}

// Run the main function
main();
