<h1 align="center">💰 SpendMate</h1>

<p align="center"><strong>Smart Personal Finance & Expense Tracking Made Simple</strong></p>

<p align="center">
SpendMate is a modern, feature-rich personal finance app designed to help you track every rupee, understand your spending patterns, and achieve your financial goals with intelligent analytics and a beautiful, fluid UI.
</p>

<div align="center">

[![GitHub](https://img.shields.io/github/stars/farhan10ansari/spendmate?style=social)](https://github.com/farhan10ansari/spendmate)
[![License: BSL](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/farhan10ansari/SpendMate/blob/main/LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/farhan10ansari/spendmate/releases)
[![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen)](https://github.com/farhan10ansari/spendmate)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Why SpendMate?](#why-spendmate)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Development](#development)
- [Usage](#usage)
- [Features Breakdown](#features-breakdown)
- [Screenshots](#screenshots)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Support & Community](#support--community)
- [Author](#author)

---

## 🎯 Overview

**SpendMate** is your ultimate personal finance companion. Track expenses and income in real-time, visualize spending patterns across multiple time periods (today, this week, last week, each month, each year, or all time), and make data-driven financial decisions. With advanced analytics, secure backup, and customizable themes, SpendMate empowers you to take complete control of your finances.

Built with React Native and Expo for seamless performance on iOS and Android, SpendMate combines powerful financial tracking with an intuitive, smooth user experience.

---

## ✅ Why SpendMate?

- 📊 **Advanced Multi-Period Analytics** - Track net income, savings rate, transaction counts, daily averages, and top categories across custom time periods
- 🎨 **Modern & Smooth UI** - Beautiful, fluid interface with multiple themes and haptic feedback
- 🔒 **Secure & Private** - App lock with biometric protection, encrypted backup, and local data storage
- 🌍 **Global Support** - Multi-currency support with flexible number formatting
- ⚡ **Fast & Responsive** - Lightning-quick performance optimized for mobile
- 💾 **Data Ownership** - Complete backup and restore capabilities to file
- 🔔 **Smart Reminders** - Daily notifications to keep you on track
- 🎯 **Fully Customizable** - Create unlimited custom expense and income categories and sources

---

## ✨ Key Features

### 📱 Core Tracking

- **Expense Management (CRUD)** - Add, edit, update, and delete expenses with ease
- **Income Tracking (CRUD)** - Record multiple income streams and sources
- **Custom Categories** - Create unlimited expense categories tailored to your needs
- **Custom Sources** - Define custom income sources (salary, freelance, investments, etc.)
- **Transaction Organization** - Filter and organize transactions by date, category, and source

### 📊 Advanced Analytics & Insights

- **Multi-Period Statistics** - View comprehensive data across: Today | This Week | Last Week | Each Month | Each Year | All Time
- **Net Income Calculation** - Automatic calculation of income minus expenses
- **Savings Rate Analysis** - Track what percentage of income you're saving
- **Transaction Counts** - Monitor total number of income and expense transactions
- **Daily Average Spending** - See average spending per day across selected periods
- **Top Income Categories** - Identify your highest income sources
- **Min/Max Transaction Analysis** - Find your largest and smallest transactions
- **Visual Charts** - Pie charts, line graphs, and bar charts for spending visualization

### 🎨 Customization & User Experience

- **Multiple Themes** - Dark mode, light mode, and custom color schemes
- **Haptic Feedback** - Tactile response on interactions for better feedback
- **Daily Reminders** - Customizable notifications to log expenses
- **Multi-Currency Support** - Support for all major global currencies
- **Number Formatting** - Flexible display options (1,000 vs 1.000 vs 1 000)
- **Custom Appearance** - Personalize the app to match your preferences

### 🔐 Security & Data Management

- **App Lock** - Biometric authentication (fingerprint/face) and PIN protection
- **Backup & Restore** - Export data to file and restore anytime
- **Local Data Storage** - All data stored locally on your device for privacy
- **Automatic Session Timeout** - Enhanced security with session management
- **Encrypted Storage** - Sensitive data encrypted for maximum protection

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | React Native with Expo |
| **Language** | JavaScript / TypeScript |
| **Database** | SQLite |
| **ORM** | Drizzle ORM |
| **State Management** | Zustand & Context API |
| **UI Framework** | React Native Paper |
| **Build Tool** | Expo CLI |
| **Code Quality** | ESLint |

---

## 📥 Installation

### Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Node.js** v22.17 or higher ([Download](https://nodejs.org/))
- **yarn** package manager (`npm install -g yarn`)
- **Git** ([Download](https://git-scm.com))
- **Expo CLI** (`npm install -g expo-cli`)
- **Android Studio** (for Android development) or **Xcode** (for iOS on macOS)

### Clone Repository

```

git clone https://github.com/farhan10ansari/spendmate.git
cd spendmate

```

### Install Dependencies

```

yarn install

```

---

## 🔧 Environment Setup

Create a `.env` file in the root directory of the project:

```

cp .env.example .env

```

Add the following environment variables to your `.env` file:

```

EXPO_PUBLIC_APP_NAME="SpendMate"
EXPO_PUBLIC_APP_VERSION="1.0.0"
EXPO_PUBLIC_APP_AUTHOR="farhan10ansari"
EXPO_PUBLIC_TELEGRAM_URL="https://t.me/farhan10ansari_expense_mate_disc"
EXPO_PUBLIC_CONTACT_EMAIL="farhan10ansari@gmail.com"
EXPO_PUBLIC_LOG_LEVEL="error"

```

**Configuration Details:**

- `EXPO_PUBLIC_APP_NAME` - Display name of the application
- `EXPO_PUBLIC_APP_VERSION` - Current version number
- `EXPO_PUBLIC_APP_AUTHOR` - App developer/author name
- `EXPO_PUBLIC_TELEGRAM_URL` - Community discussion group link
- `EXPO_PUBLIC_CONTACT_EMAIL` - Contact email for support
- `EXPO_PUBLIC_LOG_LEVEL` - Logging level (error, warn, info, debug)

---

## 🚀 Development

### Start Development Server

```

yarn start

```

This will start the Expo development server. You can then:

- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Scan the QR code with Expo Go app on your phone

### Build Application

```

yarn build

```

Builds the app for production.

### Lint Code

```

yarn lint

```

Checks code quality and style issues.

---

## 💡 Usage

### Getting Started

1. **Install the App** - Download and install SpendMate on your device
2. **Launch the App** - Open SpendMate for the first time
3. **Set Preferences** - Configure your currency, theme, and notification settings
4. **Add Categories** - Create custom expense and income categories
5. **Start Tracking** - Log your first expense or income
6. **View Analytics** - Check your dashboard for insights and trends

### Quick Actions

```

✅ Add Expense
→ Tap "+" button
→ Select expense category
→ Enter amount
→ Add optional note
→ Save

✅ Add Income
→ Tap "+" button
→ Select income source
→ Enter amount
→ Save

✅ View Analytics
→ Go to Dashboard/Analytics
→ Select time period (Today, Week, Month, Year, All Time)
→ View stats, charts, and trends

✅ Backup Data
→ Go to Settings
→ Select "Backup \& Restore"
→ Tap "Export Data"
→ Choose location to save file

✅ Restore Data
→ Go to Settings
→ Select "Backup \& Restore"
→ Tap "Import Data"
→ Select backup file
→ Confirm restore

```

---

## 📊 Features Breakdown

### Expense Management

- Full CRUD operations for expenses
- Categorize by custom categories
- Add optional notes and receipts
- Filter by date range and category
- Easy edit and delete functionality
- Recurring expense support

### Income Management

- Track multiple income streams
- Categorize by source (salary, freelance, bonus, investments, etc.)
- Add notes and details
- Track income growth over time
- Compare income across periods

### Analytics Dashboard

- **Visual Representations** - Pie charts showing spending distribution, line graphs for trends, bar charts for comparisons
- **Custom Time Periods** - Filter analytics by Today, This Week, Last Week, Each Month, Each Year, or All Time
- **Comprehensive Metrics** - Net income, savings rate, total income, total expenses, transaction counts, daily averages, top categories, min/max transactions
- **Exportable Reports** - Generate and export financial reports
- **Comparison Analysis** - Compare spending and income across different periods

### Security & Privacy

- Biometric authentication (fingerprint, face recognition)
- PIN-based app lock
- End-to-end encrypted data
- No cloud dependencies - full local storage
- Automatic session timeout for security
- Manual backup export for data control

### Customization Options

- Light, dark, and custom themes
- Choose preferred currency and number format
- Customize expense and income categories
- Set custom reminders and notifications
- Personalize theme colors

---

## 📸 Screenshots

<!-- Add your app screenshots in the corresponding folders -->

```

![Dashboard](./screenshots/dashboard.png "SpendMate Dashboard - View all your financial data")
![Analytics](./screenshots/analytics.png "Advanced Analytics - Multi-period statistics")
![Add Transaction](./screenshots/add-transaction.png "Add Transaction - Quick expense/income logging")
![Settings](./screenshots/settings.png "Settings - Customization & Security")
![Themes](./screenshots/themes.png "Multiple Themes - Light, dark, and custom modes")
![Charts](./screenshots/charts.png "Visual Charts - Spending patterns and trends")

```

---

## 🗺️ Roadmap

- [x] Core CRUD operations for income and expenses
- [x] Multi-period analytics dashboard
- [x] Custom categories and income sources
- [x] Multiple theme support
- [x] Biometric app lock
- [x] Backup and restore functionality
- [x] Daily reminders
- [x] Multi-currency support
- [ ] Multi-device cloud sync
- [ ] Budget goals and alerts
- [ ] AI-powered spending insights
- [ ] Family sharing features
- [ ] Investment tracking
- [ ] Bill reminders and recurring transactions
- [ ] Advanced reporting and PDF export
- [ ] Data visualization improvements

---

## 🤝 Contributing

We welcome contributions! When you're ready to contribute, we'll provide detailed guidelines. For now, you can:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Check back soon for our comprehensive [CONTRIBUTING.md](CONTRIBUTING.md) guide.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```

MIT License

Copyright (c) 2025 Mohd Farhan Ansari

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

```

---

## 💬 Support & Community

Have questions, suggestions, or encountered a bug? We'd love to hear from you!

**Get in Touch:**

- **Email:** [farhan10ansari@gmail.com](mailto:farhan10ansari@gmail.com)
- **GitHub Issues:** [Report a Bug](https://github.com/farhan10ansari/spendmate/issues)
- **GitHub Discussions:** [Join the Discussion](https://github.com/farhan10ansari/spendmate/discussions)
- **Telegram Community:** [Join our Community](https://t.me/farhan10ansari_expense_mate_disc)

**Response Time:** We typically respond to issues and emails within 24-48 hours.

---

## 👨‍💻 Author

**Mohd Farhan Ansari**

A passionate developer building modern financial tools to help people take control of their money.

**Connect with Me:**

- [GitHub](https://github.com/farhan10ansari) - Check out my other projects
- [LinkedIn](https://linkedin.com/in/farhan10ansari) - Professional profile
- [Website](https://farhan10ansari.com) - Portfolio
- [Email](mailto:farhan10ansari@gmail.com) - Direct contact

---

## 🌟 Support SpendMate

If you find SpendMate helpful and it saves you time or money, please consider:

- ⭐ **Starring the repository** - Your star motivates us to keep improving
- 📢 **Sharing with friends** - Help others take control of their finances
- 💬 **Providing feedback** - Tell us what features you'd love to see
- 🐛 **Reporting bugs** - Help us make SpendMate better
- 🤝 **Contributing** - Join us in building the ultimate finance app

---

<p align="center">
  <strong>Made with ❤️ by Mohd Farhan Ansari</strong>
</p>

<p align="center">
  <strong>SpendMate v1.0.0</strong> | <a href="https://github.com/farhan10ansari/spendmate">GitHub</a> | <a href="https://t.me/farhan10ansari_expense_mate_disc">Community</a>
</p>

---

### SEO Keywords

*Personal finance app, expense tracker app, income tracker, budget management app, financial analytics app, expense management application, spending tracker, money management, personal finance app, mobile finance app, financial planning app, expense logging app, income and expense tracker, real-time finance tracking, multi-currency app, secure finance app, privacy-focused finance app, React Native app, Expo app*