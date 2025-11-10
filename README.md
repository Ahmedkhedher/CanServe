# Cancer Awareness Q&A App

A compassionate AI-powered app for cancer patients and caregivers with chat support and food analysis.

## ✨ Features

- 🤖 **AI Chat** - Ask health questions using Google Gemini
- 🍽️ **Food Scanner** - Upload food photos and get instant YES/NO for cancer patients
- 📱 **Mobile & Web** - Works on all platforms
- 🔒 **Secure** - Firebase authentication

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd cancer-awareness-qa
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Google Gemini AI

See **[GEMINI-SETUP.md](GEMINI-SETUP.md)** for detailed instructions.

Quick setup:
1. Get API key from: https://makersuite.google.com/app/apikey
2. Add to `src/services/geminiAI.ts` line 8

### 4. Start MinIO & Proxy (for food scanner)

```bash
# Terminal 1: Start MinIO
cd C:\Users\ahmed\CascadeProjects
.\minio.exe server cloud\data1 cloud\data2 --console-address ":9001"

# Terminal 2: Start Proxy
cd cancer-awareness-qa
node minio-proxy.js

# Terminal 3: Start App
npm start
```

## 🎯 Quick Start

```bash
npm start
```

Open http://localhost:8081 in your browser

## 📁 Project Structure

```
cancerapp/
├── src/
│   ├── context/           # React Context (Auth)
│   ├── data/              # Firebase configuration and store
│   ├── navigation/        # Navigation setup
│   ├── screens/           # App screens
│   │   ├── ChatScreen.tsx       # AI chat interface
│   │   ├── FeedScreen.tsx       # Q&A feed
│   │   ├── LoginScreen.tsx      # Authentication
│   │   ├── MainScreen.tsx       # Landing page
│   │   ├── ProfileScreen.tsx    # User profile
│   │   └── QuestionScreen.tsx   # Question details
│   ├── services/          # External services (Gemini AI)
│   └── ui/                # UI components, theme, responsive utilities
├── App.tsx                # App entry point
├── package.json           # Dependencies
└── README.md             # This file
```

## 🔧 Troubleshooting

```bash
npm install
# Clear cache if needed
npm start -- --reset-cache
```


### Build Errors
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📝 Development Commands

```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS (Mac only)
npm run ios

# Run on web
npm run web

# Format code
npx prettier --write .
```

