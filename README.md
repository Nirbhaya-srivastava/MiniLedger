# MiniLedger – Personal Loan Tracker

A simple and organized personal loan management application designed to help users record money lent to friends and family, monitor outstanding balances, and manage repayment records.

---

## 📌 Table of Contents

- [About the Project](#-about-the-project)
- [Problem Statement](#-problem-statement)
- [Project Objectives](#-project-objectives)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Application Architecture](#-application-architecture)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation and Setup](#-installation-and-setup)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Android Build](#-android-build)
- [Database Design](#-database-design)
- [Security Considerations](#-security-considerations)
- [Troubleshooting](#-troubleshooting)
- [Future Enhancements](#-future-enhancements)
- [Contributing](#-contributing)
- [Author](#-author)
- [License](#-license)

---

## 📖 About the Project

**MiniLedger** is a personal loan tracking application built to simplify the process of managing money lent to friends, family members, and other known individuals.

Keeping track of personal loans using notebooks, messages, or spreadsheets can become difficult when there are multiple borrowers and repayments. MiniLedger aims to provide a centralized place to record loan information and review outstanding amounts.

The application uses React Native and Expo with TypeScript. Its project structure also includes database-related code for managing loan records.

MiniLedger is designed with a focus on simplicity, usability, and organized financial record management.

## 🎯 Problem Statement

People frequently lend money to friends and family but may forget the original amount, repayment details, or outstanding balance.

Common challenges include:

- Difficulty remembering who borrowed money.
- Losing track of the original loan amount.
- Confusion about how much has been repaid.
- Maintaining loan records across different notebooks or applications.
- Difficulty reviewing multiple personal loans in one place.

MiniLedger aims to address these challenges by providing a structured digital system for maintaining personal loan records.

## 🎯 Project Objectives

The primary objectives of MiniLedger are:

1. Provide an organized interface for managing personal loans.
2. Allow users to create and review loan records.
3. Present a summary of lending activity.
4. Help users maintain repayment information.
5. Provide a convenient interface for viewing loan details and receipts.
6. Use a maintainable application structure with reusable components.
7. Support Android development through React Native and Expo.

## ✨ Key Features

### 1. Phone Login

The application includes a phone-based login interface.

- Provides a dedicated login screen.
- Supports a phone-oriented authentication workflow.
- Can serve as the entry point to the application.

*Note: Actual authentication methods, OTP verification, and backend session handling depend on the implementation.*

### 2. Loan Creation

The loan creation interface allows users to enter information about money they lend.

Potential loan details include:

- Borrower's name.
- Loan amount.
- Loan date.
- Due date.
- Description or notes.
- Repayment status.

The exact fields depend on the implemented loan form.

### 3. Loan List and Management

The loan list component provides an organized view of loan records.

It can help users:

- Review existing loans.
- Identify individual borrowers.
- View loan amounts and repayment information.
- Access loan details for further management.

### 4. Summary Dashboard

The summary card component provides a reusable interface for displaying key information.

Depending on the implemented calculations, summary metrics may include:

- Total amount lent.
- Total amount repaid.
- Outstanding loan balance.
- Number of active loans.

### 5. Receipt Interface

The receipt modal provides an interface for displaying receipt-related information.

Receipt functionality may help users review loan or payment details. Receipt generation, PDF downloads, and sharing should only be considered available if they are implemented in the application.

### 6. Database Integration

The project includes database-related files and Drizzle ORM configuration.

These components provide a foundation for defining database schemas and interacting with stored records.

The configured database, connection method, and available operations depend on the backend implementation.

### 7. Testing Interface

The project includes a test runner modal for development and testing workflows.

Its exact capabilities depend on the implemented testing logic.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| React Native | Building the mobile user interface |
| Expo | Simplifying React Native development |
| TypeScript | Type-safe application development |
| Metro | JavaScript bundling for React Native |
| PostgreSQL | Relational database, if configured |
| Drizzle ORM | Database schema and query management |
| Node.js | JavaScript runtime for applicable tooling or backend services |
| npm | Dependency management |
| Git | Version control |
| GitHub | Source code hosting |

**Important:** The final technology list should reflect the dependencies and services actually configured in your `package.json` and application code.

## 🏗️ Application Architecture

MiniLedger can be organized into the following logical layers:

### Presentation Layer

Responsible for displaying application screens and reusable UI components.

Examples from the project include:

- `PhoneLogin.tsx`
- `CreateLoanModal.tsx`
- `LoanList.tsx`
- `SummaryCard.tsx`
- `ReceiptModal.tsx`

### Application Logic Layer

Responsible for handling user actions, form state, validation, and interactions between screens and data services.

### Data Layer

Responsible for defining loan-related data structures and database operations.

The project includes files such as:

- `schema.ts`
- `loans.ts`
- `index.ts`
- `drizzle.config.ts`

### Database Layer

If PostgreSQL is configured, it can store structured loan records and related information. The database connection and query implementation must be configured for the environment in which the application runs.

---

## 📂 Project Structure

The following is an illustrative structure based on the files identified in the project. Your actual repository may contain additional files.

```text
MiniLedger/
│
├── src/
│   ├── components/
│   │   ├── CreateLoanModal.tsx
│   │   ├── LoanList.tsx
│   │   ├── PhoneLogin.tsx
│   │   ├── ReceiptModal.tsx
│   │   ├── SummaryCard.tsx
│   │   └── TestRunnerModal.tsx
│   │
│   └── db/
│       ├── drizzle.config.ts
│       ├── index.ts
│       ├── loans.ts
│       └── schema.ts
│
├── App.tsx
├── app.json
├── index.ts
├── package.json
├── package-lock.json
├── tsconfig.json
├── metro.config.js
├── .gitignore
└── README.md
```

### Important Files

| File | Description |
|---|---|
| `App.tsx` | Main React Native application component |
| `app.json` | Expo application configuration |
| `index.ts` | Application entry point or other project-specific entry module |
| `package.json` | Dependencies and npm scripts |
| `package-lock.json` | Locks npm dependency versions |
| `tsconfig.json` | TypeScript compiler configuration |
| `metro.config.js` | Metro bundler configuration, if customized |
| `.gitignore` | Specifies files and directories Git should ignore |
| `README.md` | Project documentation |
| `src/components/` | Reusable UI components |
| `src/db/` | Database-related code and configuration |

---

## 📋 Prerequisites

Before running MiniLedger, make sure the following tools are installed.

### Required Software

- **Node.js:** Install a supported LTS version.
- **npm:** Included with Node.js.
- **Git:** Required to clone the repository.
- **Expo-compatible environment:** Expo Go or an Android emulator, depending on the application's dependencies.
- **Android Studio:** Recommended for running and testing the application in an Android emulator.

A configured database and backend are also required if your application depends on remote data storage.

---

## 🚀 Installation and Setup

### Step 1: Clone the Repository

Replace the placeholder URL with your actual GitHub repository URL.

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### Step 2: Navigate to the Project Directory

```bash
cd MiniLedger
```

### Step 3: Install Dependencies

```bash
npm install
```

This command installs the dependencies listed in `package.json`.

### Step 4: Configure Environment Variables

Create a local `.env` file if the project requires environment variables.

Add the variables required by your actual database, backend, and authentication configuration.

Do not copy example credentials from documentation into production.

### Step 5: Configure the Database

If MiniLedger uses PostgreSQL, configure the database connection and any required migration commands according to the project's database setup.

Verify that the configured database is accessible before testing database-dependent features.

---

## ▶️ Running the Application

### Start the Expo Development Server

```bash
npx expo start
```

After the development server starts, follow the instructions shown in the terminal.

### Run on Android

You can use one of the following options:

**Option 1: Android emulator**

1. Install and configure Android Studio.
2. Start an Android virtual device.
3. Run `npx expo start`.
4. Open the application using the available Expo development workflow.

**Option 2: Physical Android device**

1. Install Expo Go if your project is compatible with it.
2. Connect your phone and development computer to the same network, if needed.
3. Run `npx expo start`.
4. Scan the displayed QR code with the appropriate Expo workflow.

Some native dependencies require a development build rather than Expo Go.

---

## 📱 Android Build

To generate an installable Android application, you can use Expo Application Services (EAS).

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Sign In

```bash
eas login
```

### Step 3: Configure the Build

```bash
eas build:configure
```

Review the generated `eas.json` and configure an appropriate Android build profile.

### Step 4: Generate an APK

For a preview profile configured to produce an APK, run:

```bash
eas build --platform android --profile preview
```

The build profile must be configured appropriately for APK output. Otherwise, the build may produce an Android App Bundle instead.

**Note:** GitHub hosts your source code; an APK or AAB must be generated separately. Do not claim the app is published on Google Play unless it has actually been published.

---

## 🗄️ Database Design

MiniLedger includes database-related files for loan data management.

### Loan Records

A loan record may include fields such as:

| Field | Purpose |
|---|---|
| Loan ID | Unique identifier for a loan |
| Borrower name | Identifies the borrower |
| Principal amount | Original amount lent |
| Loan date | Date the loan was recorded |
| Due date | Expected repayment date |
| Repaid amount | Amount repaid so far |
| Outstanding amount | Remaining amount owed |
| Status | Current loan status |

These are illustrative fields, not a guarantee of the exact database schema. Refer to the actual `schema.ts` file for the implemented data model.

### Database Configuration

If PostgreSQL is used, the application needs a valid database connection. Database credentials should be stored securely in environment variables on the backend.

Never expose database administrator credentials in a mobile application or public repository.

---

## 🔐 Security Considerations

Because MiniLedger handles personal financial records, security is important.

- Do not commit `.env` files or real API keys.
- Do not expose database passwords in client-side code.
- Validate user input before storing loan information.
- Use appropriate authentication and authorization.
- Protect loan records so that users can access only the records they are authorized to view.
- Use encrypted connections for remote services.
- Avoid storing sensitive information unnecessarily.
- Keep project dependencies updated.

Security features should be described as implemented only after they have been verified.

---

## 🧪 Testing

Testing should cover the main user workflows.

Recommended test cases include:

1. Opening the application.
2. Using the login interface.
3. Creating a loan record.
4. Viewing the loan list.
5. Checking summary calculations.
6. Viewing receipt details.
7. Validating required form fields.
8. Handling database connection failures.
9. Testing on different Android screen sizes.
10. Verifying that sensitive credentials are not exposed.

These are recommended tests; the actual test coverage depends on the tests implemented in the repository.

---

## 🛠️ Troubleshooting

### Dependency Installation Problems

Try reinstalling dependencies:

```bash
npm install
```

### Expo Cache Problems

Restart Expo with the cache cleared:

```bash
npx expo start --clear
```

### Database Connection Errors

Check that:

- The database server is available.
- The connection URL is correct.
- The required environment variables are configured.
- Network access and database permissions are correct.

### Android Build Errors

Check the Expo configuration, package versions, native dependencies, and EAS build logs.

Resolve the underlying configuration problem before attempting another build.

---

## 🔮 Future Enhancements

Potential improvements for MiniLedger include:

- Payment reminders and due-date notifications.
- Detailed repayment history.
- Search and filtering by borrower.
- Exporting loan records to PDF or CSV.
- Receipt generation and sharing.
- Dashboard charts and financial summaries.
- Optional cloud synchronization.
- Backup and restore functionality.
- Improved authentication and account management.
- Dark mode and additional accessibility improvements.

These are proposed enhancements and should not be presented as completed features unless implemented.

---

## 🤝 Contributing

Contributions and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test your changes.
5. Submit a pull request describing your improvements.

Please avoid committing credentials, build artifacts, or unnecessary generated files.

---

## 👨‍💻 Author

**Nirbhaya Kumar Srivastava**

B.Tech in Computer Science and Engineering

Interested in full-stack development, mobile application development, and building practical software solutions.

### GitHub

Add your GitHub profile link here.

---

## 📄 License

No license has been specified for this project yet.

If you want other people to use, modify, or redistribute MiniLedger, choose an appropriate open-source license and add the corresponding `LICENSE` file to the repository.

---

## ⭐ Support

If you find this project useful, consider giving the repository a star on GitHub.

Thank you for checking out MiniLedger!
