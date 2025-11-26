# Dark Mode Update Guide

This file documents the dark mode classes that need to be added to all feature components.

## Common Patterns:

1. Headings: `text-gray-900` → `text-gray-900 dark:text-white`
2. Subheadings: `text-gray-600` → `text-gray-600 dark:text-gray-300`
3. Backgrounds: `bg-white` → `bg-white dark:bg-gray-800`
4. Borders: `border-gray-200` → `border-gray-200 dark:border-gray-700`
5. Cards: Add `dark:shadow-lg` to shadow classes
6. Input fields: Add `dark:bg-gray-700 dark:text-white dark:border-gray-600`
7. Icons: Update color classes with dark variants
8. Buttons: Add dark mode hover states

