#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Validates that all required environment variables are set and have valid values
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Required environment variables with their validation rules
const requiredVars = {
  VITE_APP_TITLE: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 100
  },
  VITE_COUCHDB_URL: {
    required: true,
    type: 'url',
    pattern: /^https?:\/\/.+/
  },
  VITE_DEFAULT_LOCALE: {
    required: true,
    type: 'string',
    pattern: /^[a-z]{2}-[A-Z]{2}$/
  },
  VITE_DEFAULT_CURRENCY: {
    required: true,
    type: 'string',
    pattern: /^[A-Z]{3}$/
  },
  VITE_ENABLE_SYNC: {
    required: true,
    type: 'boolean'
  },
  VITE_MAX_SUGGESTIONS: {
    required: true,
    type: 'number',
    min: 1,
    max: 20
  }
};

// Optional environment variables with validation
const optionalVars = {
  VITE_COUCHDB_USERNAME: {
    type: 'string',
    minLength: 1
  },
  VITE_COUCHDB_PASSWORD: {
    type: 'string',
    minLength: 1
  },
  VITE_API_BASE_URL: {
    type: 'url',
    pattern: /^https?:\/\/.+/
  }
};

/**
 * Load environment variables from file
 */
function loadEnvFile(filename) {
  try {
    const content = readFileSync(join(process.cwd(), filename), 'utf8');
    const vars = {};

    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        vars[key.trim()] = valueParts.join('=').trim();
      }
    });

    return vars;
  } catch (error) {
    return {};
  }
}

/**
 * Validate a single environment variable
 */
function validateVar(name, value, rules) {
  const errors = [];

  if (rules.required && (!value || value.trim() === '')) {
    errors.push(`${name} is required but not set`);
    return errors;
  }

  if (!value) return errors; // Skip validation for optional empty values

  // Type validation
  switch (rules.type) {
    case 'string':
      if (typeof value !== 'string') {
        errors.push(`${name} must be a string`);
      }
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${name} must be at least ${rules.minLength} characters`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${name} must be at most ${rules.maxLength} characters`);
      }
      break;

    case 'number':
      const num = Number(value);
      if (isNaN(num)) {
        errors.push(`${name} must be a valid number`);
      } else {
        if (rules.min !== undefined && num < rules.min) {
          errors.push(`${name} must be at least ${rules.min}`);
        }
        if (rules.max !== undefined && num > rules.max) {
          errors.push(`${name} must be at most ${rules.max}`);
        }
      }
      break;

    case 'boolean':
      if (!['true', 'false', '1', '0'].includes(value.toLowerCase())) {
        errors.push(`${name} must be a boolean (true/false/1/0)`);
      }
      break;

    case 'url':
      try {
        new URL(value);
      } catch {
        errors.push(`${name} must be a valid URL`);
      }
      break;
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(value)) {
    errors.push(`${name} format is invalid`);
  }

  return errors;
}

/**
 * Main validation function
 */
function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n');

  // Load environment files
  const envFiles = ['.env.example', '.env.development', '.env.production', '.env.local'];
  const allVars = {};

  envFiles.forEach(file => {
    const vars = loadEnvFile(file);
    Object.assign(allVars, vars);
    if (Object.keys(vars).length > 0) {
      console.log(`📁 Loaded ${Object.keys(vars).length} variables from ${file}`);
    }
  });

  // Also include process.env variables that start with VITE_
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('VITE_')) {
      allVars[key] = process.env[key];
    }
  });

  console.log(`\n📊 Total variables found: ${Object.keys(allVars).length}\n`);

  const errors = [];
  const warnings = [];

  // Validate required variables
  Object.entries(requiredVars).forEach(([name, rules]) => {
    const value = allVars[name];
    const varErrors = validateVar(name, value, rules);

    if (varErrors.length > 0) {
      errors.push(...varErrors);
    } else {
      console.log(`✅ ${name}: ${value || '(empty)'}`);
    }
  });

  // Validate optional variables
  Object.entries(optionalVars).forEach(([name, rules]) => {
    const value = allVars[name];
    if (value) {
      const varErrors = validateVar(name, value, rules);

      if (varErrors.length > 0) {
        warnings.push(...varErrors);
      } else {
        console.log(`✅ ${name}: ${value}`);
      }
    } else {
      console.log(`⚪ ${name}: (not set)`);
    }
  });

  // Check for unknown VITE_ variables
  Object.keys(allVars).forEach(name => {
    if (name.startsWith('VITE_') &&
        !requiredVars[name] &&
        !optionalVars[name]) {
      warnings.push(`Unknown variable: ${name}`);
    }
  });

  // Report results
  console.log('\n' + '='.repeat(50));

  if (errors.length > 0) {
    console.log('\n❌ Validation FAILED:');
    errors.forEach(error => console.log(`  • ${error}`));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.log(`  • ${warning}`));
  }

  if (errors.length === 0) {
    console.log('\n✨ Environment validation PASSED!');

    // Show configuration summary
    console.log('\n📋 Configuration Summary:');
    console.log(`  App: ${allVars.VITE_APP_TITLE || 'Not set'}`);
    console.log(`  Database: ${allVars.VITE_COUCHDB_URL || 'Not set'}`);
    console.log(`  Locale: ${allVars.VITE_DEFAULT_LOCALE || 'Not set'}`);
    console.log(`  Currency: ${allVars.VITE_DEFAULT_CURRENCY || 'Not set'}`);
    console.log(`  Sync: ${allVars.VITE_ENABLE_SYNC || 'Not set'}`);
  }

  console.log('\n' + '='.repeat(50));

  // Exit with appropriate code
  process.exit(errors.length > 0 ? 1 : 0);
}

// Run validation
validateEnvironment();
