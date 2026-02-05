# AGENTS

This document captures the shared standards, features, tooling, and key packages for SpendMate.

## Project Overview
- SpendMate is an Expo + React Native expense management app for iOS and Android.
- Local-first data storage using SQLite with Drizzle ORM.
- Navigation uses Expo Router with typed routes enabled.

## Standards We Follow
- TypeScript strict mode via `tsconfig.json`.
- ESLint with Expo flat config (`eslint.config.js`).
- Expo app config lives in `app.json`.
- Database schema and migrations use Drizzle (`drizzle.config.ts`).
- Environment variables use `EXPO_PUBLIC_*` keys and are documented in `README.md` and `eas.json`.
- Prefer local data storage and privacy-first design (no default cloud dependency).
- Use the most efficient approach to solve the problem.

## Features (Current)
- Expense and income tracking with full CRUD.
- Custom categories and income sources.
- Multi-period analytics (today, week, month, year, all time).
- Visual charts and key metrics (net income, savings rate, averages, min/max).
- Themes, haptics, and appearance customization.
- Multi-currency support and locale-aware formatting.
- App lock with biometric authentication.
- Backup and restore to file.
- Daily reminders via notifications.

## Tooling and Commands
- Dev server: `yarn start` or `yarn dev` (Expo).
- Android/iOS native runs: `yarn android`, `yarn ios`.
- Linting: `yarn lint`.
- Database migration generation: `yarn db:migrate`.
- Expo doctor: `yarn doctor`.
- EAS builds: `yarn build:preview`, `yarn build:development`, `yarn build:production`.

## Important Packages
- Core: `expo`, `react`, `react-native`.
- Navigation: `expo-router`, `@react-navigation/*`.
- State/data: `zustand`, `@tanstack/react-query` (async state management).
- Database: `expo-sqlite`, `drizzle-orm`, `drizzle-kit`.
- UI: `react-native-paper`, `expo-blur`, `expo-linear-gradient`.
- UX: `expo-haptics`, `lottie-react-native`, `react-native-reanimated`.
- Charts: `react-native-gifted-charts`.
- Auth/security: `expo-local-authentication`.
- Notifications: `expo-notifications`.
- Utilities: `date-fns`, `lodash`, `slugify`.

## Configuration References
- App config: `app.json`.
- EAS build profiles: `eas.json`.
- ESLint config: `eslint.config.js`.
- Drizzle config: `drizzle.config.ts`.
