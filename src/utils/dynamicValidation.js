// Dynamic Validation Utility
// This utility provides flexible validation rules that can be configured dynamically

export class DynamicValidator {
  constructor() {
    this.rules = new Map();
    this.messages = new Map();
    this.setupDefaultRules();
  }

  // Setup default validation rules
  setupDefaultRules() {
    // Email validation rules
    this.addRule('email', {
      required: true,
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      noSpaces: true,
      transform: (value) => value?.toLowerCase().trim()
    });

    this.addMessage('email', {
      required: 'Email is required',
      pattern: 'Enter a valid email address',
      noSpaces: 'Email cannot contain spaces'
    });

    // Password validation rules
    this.addRule('password', {
      required: true,
      minLength: 6,
      noSpaces: true,
      patterns: {
        uppercase: /[A-Z]/,
        lowercase: /[a-z]/,
        digit: /\d/,
        special: /[!@#$%^&*(),.?":{}|<>]/
      }
    });

    this.addMessage('password', {
      required: 'Password is required',
      minLength: 'Password must be at least {minLength} characters',
      noSpaces: 'Password cannot contain spaces',
      patterns: 'Password should include at least one uppercase letter, one lowercase letter, one digit, and one special character'
    });

    // Login password (more lenient)
    this.addRule('loginPassword', {
      required: true,
      minLength: 6,
      noSpaces: true
    });

    this.addMessage('loginPassword', {
      required: 'Password is required',
      minLength: 'Password must be at least {minLength} characters',
      noSpaces: 'Password cannot contain spaces'
    });

    // Full name validation rules
    this.addRule('fullName', {
      required: true,
      pattern: /^[a-zA-Z' ]+$/,
      noLeadingSpace: true,
      noNumbers: true,
      noSpecialChars: /[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/,
      noMultipleSpaces: true,
      capitalizeFirst: true
    });

    this.addMessage('fullName', {
      required: 'Full Name is required',
      pattern: 'Full Name should only contain letters, and single spaces',
      noLeadingSpace: 'Full Name cannot start with a space',
      noNumbers: 'Numbers are not allowed in the name',
      noSpecialChars: 'Special characters are not allowed in the name',
      noMultipleSpaces: 'Full Name should only contain single spaces',
      capitalizeFirst: 'First letter of Full Name must be capital'
    });

    // Phone validation rules
    this.addRule('phone', {
      required: true,
      pattern: /^(\+91[6-9][0-9]{9}|[6789][0-9]{9})$/,
      noRepeatingDigits: /(\d)\1{9}/
    });

    this.addMessage('phone', {
      required: 'Phone number is required',
      pattern: 'Enter a valid phone number',
      noRepeatingDigits: 'Phone number cannot contain repeating digits'
    });

    // Confirm password validation
    this.addRule('confirmPassword', {
      required: true,
      matchField: 'password'
    });

    this.addMessage('confirmPassword', {
      required: 'Confirm Password is required',
      matchField: 'Passwords do not match'
    });
  }

  // Add or update validation rule
  addRule(fieldName, rules) {
    this.rules.set(fieldName, { ...this.rules.get(fieldName), ...rules });
  }

  // Add or update validation messages
  addMessage(fieldName, messages) {
    this.messages.set(fieldName, { ...this.messages.get(fieldName), ...messages });
  }

  // Get validation rule for a field
  getRule(fieldName) {
    return this.rules.get(fieldName) || {};
  }

  // Get validation messages for a field
  getMessages(fieldName) {
    return this.messages.get(fieldName) || {};
  }

  // Validate a single field
  validateField(fieldName, value, formData = {}) {
    const rules = this.getRule(fieldName);
    const messages = this.getMessages(fieldName);

    if (!rules) {
      return ''; // No rules defined, consider valid
    }

    // Transform value if transform function is provided
    if (rules.transform && typeof rules.transform === 'function') {
      value = rules.transform(value);
    }

    // Required validation
    if (rules.required && (!value || value.trim() === '')) {
      return messages.required || `${fieldName} is required`;
    }

    // Skip other validations if field is empty and not required
    if (!value || value.trim() === '') {
      return '';
    }

    // No spaces validation
    if (rules.noSpaces && value.includes(' ')) {
      return messages.noSpaces || `${fieldName} cannot contain spaces`;
    }

    // No leading space validation
    if (rules.noLeadingSpace && value.charAt(0) === ' ') {
      return messages.noLeadingSpace || `${fieldName} cannot start with a space`;
    }

    // No numbers validation
    if (rules.noNumbers && /[0-9]/.test(value)) {
      return messages.noNumbers || `Numbers are not allowed in ${fieldName}`;
    }

    // No special characters validation
    if (rules.noSpecialChars && rules.noSpecialChars.test(value)) {
      return messages.noSpecialChars || `Special characters are not allowed in ${fieldName}`;
    }

    // No multiple spaces validation
    if (rules.noMultipleSpaces && /\s{2,}/.test(value)) {
      return messages.noMultipleSpaces || `${fieldName} should only contain single spaces`;
    }

    // Capitalize first validation
    if (rules.capitalizeFirst && !/^[A-Z]/.test(value)) {
      return messages.capitalizeFirst || `First letter of ${fieldName} must be capital`;
    }

    // Minimum length validation
    if (rules.minLength && value.length < rules.minLength) {
      return (messages.minLength || `${fieldName} must be at least {minLength} characters`)
        .replace('{minLength}', rules.minLength);
    }

    // Maximum length validation
    if (rules.maxLength && value.length > rules.maxLength) {
      return (messages.maxLength || `${fieldName} must be at most {maxLength} characters`)
        .replace('{maxLength}', rules.maxLength);
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      return messages.pattern || `${fieldName} format is invalid`;
    }

    // No repeating digits validation (for phone numbers)
    if (rules.noRepeatingDigits && rules.noRepeatingDigits.test(value)) {
      return messages.noRepeatingDigits || `${fieldName} cannot contain repeating digits`;
    }

    // Complex pattern validation (for passwords)
    if (rules.patterns && typeof rules.patterns === 'object') {
      const failedPatterns = [];
      for (const [patternName, pattern] of Object.entries(rules.patterns)) {
        if (!pattern.test(value)) {
          failedPatterns.push(patternName);
        }
      }
      if (failedPatterns.length > 0) {
        return messages.patterns || `${fieldName} does not meet complexity requirements`;
      }
    }

    // Match field validation (for confirm password)
    if (rules.matchField && formData[rules.matchField] !== value) {
      return messages.matchField || `${fieldName} does not match ${rules.matchField}`;
    }

    return ''; // Valid
  }

  // Validate multiple fields
  validateForm(formData, fieldNames = null) {
    const errors = {};
    const fieldsToValidate = fieldNames || Object.keys(formData);

    for (const fieldName of fieldsToValidate) {
      const error = this.validateField(fieldName, formData[fieldName], formData);
      if (error) {
        errors[fieldName] = error;
      }
    }

    return errors;
  }

  // Check if form is valid
  isFormValid(formData, fieldNames = null) {
    const errors = this.validateForm(formData, fieldNames);
    return Object.keys(errors).length === 0;
  }

  // Get real-time validation function for a field
  getFieldValidator(fieldName) {
    return (value, formData = {}) => this.validateField(fieldName, value, formData);
  }

  // Get field state (valid, invalid, or neutral)
  getFieldState(fieldName, value, formData = {}) {
    if (!value || value.trim() === '') {
      return 'neutral'; // Empty field
    }
    
    const error = this.validateField(fieldName, value, formData);
    return error ? 'invalid' : 'valid';
  }

  // Get CSS classes for field styling based on validation state
  getFieldClasses(fieldName, value, formData = {}, baseClasses = '') {
    const state = this.getFieldState(fieldName, value, formData);
    
    let stateClasses = '';
    switch (state) {
      case 'valid':
        stateClasses = 'border-green-500 focus:ring-green-500';
        break;
      case 'invalid':
        stateClasses = 'border-red-500 focus:ring-red-500';
        break;
      default:
        stateClasses = 'border-gray-300 focus:ring-blue-500';
    }
    
    return `${baseClasses} ${stateClasses}`.trim();
  }

  // Create custom validation rule
  createCustomRule(fieldName, validator, message) {
    this.addRule(fieldName, { custom: validator });
    this.addMessage(fieldName, { custom: message });
  }

  // Validate with custom rules
  validateWithCustomRules(fieldName, value, customRules, formData = {}) {
    // First apply standard rules
    let error = this.validateField(fieldName, value, formData);
    if (error) return error;

    // Then apply custom rules
    for (const rule of customRules) {
      if (typeof rule.validator === 'function') {
        const isValid = rule.validator(value, formData);
        if (!isValid) {
          return rule.message || `${fieldName} is invalid`;
        }
      }
    }

    return '';
  }
}

// Create a singleton instance
export const validator = new DynamicValidator();

// Export convenience functions
export const validateField = (fieldName, value, formData) => 
  validator.validateField(fieldName, value, formData);

export const validateForm = (formData, fieldNames) => 
  validator.validateForm(formData, fieldNames);

export const isFormValid = (formData, fieldNames) => 
  validator.isFormValid(formData, fieldNames);

// Export field-specific validators for backward compatibility
export const validateEmail = (email) => validator.validateField('email', email);
export const validatePassword = (password) => validator.validateField('password', password);
export const validateLoginPassword = (password) => validator.validateField('loginPassword', password);
export const validateFullName = (fullName) => validator.validateField('fullName', fullName);
export const validatePhone = (phone) => validator.validateField('phone', phone);
export const validateConfirmPassword = (confirmPassword, formData) => 
  validator.validateField('confirmPassword', confirmPassword, formData);

export default validator;