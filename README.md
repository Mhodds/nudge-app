# RUCK KICK — Pro Analytics Log

Rugby kicking analytics tracker for match day and training sessions.

## Mobile App Build Instructions

This project is configured for iOS and Android builds using Capacitor 6.

### Prerequisites

**For iOS builds:**
- macOS with Xcode installed
- CocoaPods (`sudo gem install cocoapods`)

**For Android builds:**
- Android Studio with Android SDK
- Java Development Kit (JDK) 17+

### Build Commands

```bash
# Navigate to frontend directory
cd frontend

# Build web assets and sync with native platforms
yarn cap:build

# Open iOS project in Xcode
yarn cap:open:ios

# Open Android project in Android Studio
yarn cap:open:android
```

### Step-by-Step Guide

#### iOS Build

1. Run `yarn cap:build` to build web assets and sync
2. Run `yarn cap:open:ios` to open Xcode
3. In Xcode:
   - Select your development team in Signing & Capabilities
   - Connect your iPhone or select a simulator
   - Click Play button or press Cmd+R to run

#### Android Build

1. Run `yarn cap:build` to build web assets and sync  
2. Run `yarn cap:open:android` to open Android Studio
3. In Android Studio:
   - Wait for Gradle sync to complete
   - Connect your Android device or start an emulator
   - Click Run button (green play icon)

### App Configuration

- **App ID**: `com.ruckkick.app`
- **App Name**: RUCK KICK
- **Theme Color**: `#171D2B`

To change the App ID, update `capacitor.config.ts` and then:
1. For iOS: Update in Xcode project settings
2. For Android: Update `applicationId` in `android/app/build.gradle`

### Project Structure

```
frontend/
├── ios/                 # iOS native project (open with Xcode)
├── android/             # Android native project (open with Android Studio)
├── build/               # Built web assets (bundled into mobile apps)
├── capacitor.config.ts  # Capacitor configuration
└── src/                 # React source code
```

### Useful Commands

| Command | Description |
|---------|-------------|
| `yarn dev` | Start development server |
| `yarn build` | Build web assets for production |
| `yarn cap:sync` | Sync web assets to native platforms |
| `yarn cap:build` | Build + sync in one command |
| `yarn cap:open:ios` | Open iOS project in Xcode |
| `yarn cap:open:android` | Open Android project in Android Studio |

### Troubleshooting

**iOS: Pod install errors**
```bash
cd ios/App && pod install
```

**Android: Gradle sync issues**
- Ensure Android Studio has the correct SDK version installed
- File > Sync Project with Gradle Files

**Web assets not updating**
```bash
yarn build && yarn cap:sync
```
