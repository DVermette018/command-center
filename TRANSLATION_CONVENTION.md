# Translation Keys Naming Convention

## Overview

This document establishes the naming conventions for translation keys in our internationalization (i18n) implementation. Following these conventions ensures consistency, maintainability, and clarity across all translation files.

## Core Principles

1. **Clarity over brevity** - Keys should be self-documenting
2. **Consistency** - Same patterns across the entire application
3. **Hierarchy** - Logical grouping and nesting
4. **Context-aware** - Keys should indicate where and how they're used

## Naming Rules

### 1. Case Convention

Use **snake_case** for all translation keys:
- ✅ `user_profile`
- ✅ `submit_button`
- ❌ `userProfile`
- ❌ `submit-button`

### 2. Hierarchical Structure

Organize keys using dot notation to create logical hierarchies:

```
feature.section.element.variant
```

Examples:
```json
{
  "auth": {
    "login": {
      "title": "Sign In",
      "submit_button": "Login",
      "error_invalid_credentials": "Invalid email or password"
    }
  }
}
```

### 3. Key Components

#### Feature/Module Prefix
Start with the feature or module name:
- `auth.` - Authentication related
- `dashboard.` - Dashboard module
- `settings.` - Settings page
- `common.` - Shared/global translations

#### Section/Context
Second level indicates the specific section:
- `auth.login.` - Login page
- `auth.register.` - Registration page
- `dashboard.stats.` - Statistics section

#### Element Type
Describe what the translation represents:
- `title` - Page or section titles
- `subtitle` - Secondary headings
- `description` - Descriptive text
- `label` - Form field labels
- `placeholder` - Input placeholders
- `button` - Button text
- `link` - Link text
- `message` - User messages
- `error` - Error messages
- `success` - Success messages
- `warning` - Warning messages
- `tooltip` - Tooltip content
- `helper_text` - Help or hint text

#### Specific Identifier
Final part identifies the specific element:
- `auth.login.button_submit`
- `auth.login.error_invalid_email`

## Naming Patterns

### Form Elements

```json
{
  "form": {
    "user": {
      "label_email": "Email Address",
      "label_password": "Password",
      "placeholder_email": "Enter your email",
      "placeholder_password": "Enter your password",
      "helper_text_password": "Must be at least 8 characters",
      "error_email_required": "Email is required",
      "error_email_invalid": "Please enter a valid email"
    }
  }
}
```

### Actions and Buttons

```json
{
  "actions": {
    "button_save": "Save",
    "button_cancel": "Cancel",
    "button_delete": "Delete",
    "button_edit": "Edit",
    "button_confirm": "Confirm",
    "button_back": "Go Back",
    "link_learn_more": "Learn More",
    "link_view_all": "View All"
  }
}
```

### Messages and Notifications

```json
{
  "messages": {
    "success_saved": "Successfully saved",
    "success_deleted": "Successfully deleted",
    "error_generic": "Something went wrong",
    "error_network": "Network error occurred",
    "warning_unsaved_changes": "You have unsaved changes",
    "info_loading": "Loading..."
  }
}
```

### Validation Messages

```json
{
  "validation": {
    "required": "This field is required",
    "email_invalid": "Invalid email format",
    "password_min_length": "Password must be at least {min} characters",
    "password_max_length": "Password cannot exceed {max} characters",
    "number_min": "Value must be at least {min}",
    "number_max": "Value cannot exceed {max}"
  }
}
```

## Special Cases

### 1. Pluralization

Use vue-i18n's pluralization syntax with descriptive base keys:

```json
{
  "items": {
    "count_items": "no items | one item | {count} items",
    "count_results": "No results | 1 result | {count} results"
  }
}
```

### 2. Dynamic Content

Use clear parameter names in interpolations:

```json
{
  "greeting": {
    "welcome_user": "Welcome, {userName}!",
    "last_login": "Last login: {date} at {time}"
  }
}
```

### 3. Common/Shared Translations

Place frequently used translations in a `common` namespace:

```json
{
  "common": {
    "yes": "Yes",
    "no": "No",
    "ok": "OK",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
    "warning": "Warning"
  }
}
```

### 4. Status and States

```json
{
  "status": {
    "active": "Active",
    "inactive": "Inactive",
    "pending": "Pending",
    "completed": "Completed",
    "failed": "Failed",
    "draft": "Draft",
    "published": "Published"
  }
}
```

## File Organization

### Directory Structure

```
locales/
├── en/
│   ├── common.json
│   ├── auth.json
│   ├── dashboard.json
│   ├── settings.json
│   └── validation.json
├── fr/
│   ├── common.json
│   ├── auth.json
│   ├── dashboard.json
│   ├── settings.json
│   └── validation.json
└── index.js
```

### Splitting Strategy

- **By feature**: Each major feature gets its own file
- **By frequency**: Common translations in `common.json`
- **By type**: Validation messages in `validation.json`
- **Size limit**: Split files larger than 200 lines

## Vue i18n Usage Examples

### In Templates

```vue
<template>
  <div>
    <h1>{{ $t('dashboard.overview.title') }}</h1>
    <p>{{ $t('dashboard.overview.description') }}</p>
    <button @click="save">
      {{ $t('common.button_save') }}
    </button>
    <span>{{ $t('items.count_items', { count: itemCount }) }}</span>
  </div>
</template>
```

### In Script

```javascript
export default {
  methods: {
    showSuccess() {
      this.$toast.success(this.$t('messages.success_saved'))
    },
    showError() {
      this.$toast.error(this.$t('messages.error_generic'))
    }
  }
}
```

### In Composition API

```javascript
import { useI18n } from 'vue-i18n'

export default {
  setup() {
    const { t } = useI18n()
    
    const pageTitle = computed(() => t('dashboard.overview.title'))
    const saveButton = () => {
      // Action
      console.log(t('messages.success_saved'))
    }
    
    return { pageTitle, saveButton }
  }
}
```

## Best Practices

### DO ✅

- Use descriptive, self-documenting keys
- Group related translations together
- Keep consistent naming patterns
- Use parameters for dynamic content
- Maintain the same structure across all language files
- Add comments for complex translations or context
- Use specific error messages rather than generic ones

### DON'T ❌

- Don't use the actual text as the key
  - ❌ `"Sign In": "Sign In"`
  - ✅ `"auth.login.title": "Sign In"`

- Don't mix naming conventions
  - ❌ `userProfile`, `user-settings`, `USER_DASHBOARD`
  - ✅ `user_profile`, `user_settings`, `user_dashboard`

- Don't create overly nested structures (max 4 levels)
  - ❌ `app.modules.user.profile.settings.privacy.title`
  - ✅ `user_settings.privacy.title`

- Don't hardcode translations in components
  - ❌ `<h1>Welcome</h1>`
  - ✅ `<h1>{{ $t('common.welcome') }}</h1>`

- Don't duplicate translations
  - Reuse common translations from `common` namespace

## Migration Checklist

When refactoring existing translations:

- [ ] Identify and consolidate duplicate translations
- [ ] Group related keys into logical namespaces
- [ ] Convert to snake_case if using different convention
- [ ] Extract common translations to `common.json`
- [ ] Ensure all languages have the same key structure
- [ ] Update component references to new keys
- [ ] Test all translations in the application
- [ ] Document any special cases or exceptions

## Examples of Complete Translation Objects

### Login Page

```json
{
  "auth": {
    "login": {
      "title": "Sign In to Your Account",
      "subtitle": "Welcome back!",
      "label_email": "Email",
      "label_password": "Password",
      "label_remember_me": "Remember me",
      "placeholder_email": "you@example.com",
      "placeholder_password": "Enter your password",
      "button_submit": "Sign In",
      "link_forgot_password": "Forgot password?",
      "link_create_account": "Don't have an account? Sign up",
      "error_invalid_credentials": "Invalid email or password",
      "error_account_locked": "Account has been locked",
      "success_logged_in": "Successfully logged in"
    }
  }
}
```

### User Profile

```json
{
  "profile": {
    "title": "User Profile",
    "sections": {
      "personal_info": {
        "title": "Personal Information",
        "label_first_name": "First Name",
        "label_last_name": "Last Name",
        "label_email": "Email Address",
        "label_phone": "Phone Number",
        "button_edit": "Edit Profile"
      },
      "preferences": {
        "title": "Preferences",
        "label_language": "Language",
        "label_timezone": "Timezone",
        "label_notifications": "Email Notifications",
        "helper_text_notifications": "Receive updates about your account"
      }
    },
    "messages": {
      "success_updated": "Profile updated successfully",
      "error_update_failed": "Failed to update profile"
    }
  }
}
```

## Enforcement

Consider using:
- ESLint rules for i18n key usage
- Pre-commit hooks to validate translation files
- CI/CD checks for missing translations
- Regular audits of translation files

## Version History

- v1.0.0 - Initial naming convention
- Last Updated: [Current Date]

---

**Questions or Suggestions?** Please reach out to the development team or create a pull request with proposed changes to this document.