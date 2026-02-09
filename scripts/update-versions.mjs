#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

/**
 * Updates versions.json with the current version from manifest.json
 * This should be run when reviewing Release Please PRs
 */

const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
const { version, minAppVersion } = manifest;

const versions = JSON.parse(readFileSync('versions.json', 'utf8'));

// Add new version entry if it doesn't exist
if (!versions[version]) {
  versions[version] = minAppVersion;
  writeFileSync('versions.json', JSON.stringify(versions, null, '\t') + '\n');
  console.log(`✓ Added version ${version} -> ${minAppVersion} to versions.json`);
} else {
  console.log(`✓ Version ${version} already exists in versions.json`);
}
