🚀 Nudge Check: Deployment Playbook
1. Pre-Flight (The Build)
CRITICAL: This turns your React code into the files the server and phone actually understand.

[ ] Open terminal in /frontend

[ ] Run: npm run build

[ ] Verify the /build folder has updated (check that the files inside have today's timestamp).

2. Web & iPhone Version (Hostinger)
Updating Hostinger updates the iPhone PWA wrapper immediately.

[ ] Log into Hostinger File Manager.

[ ] Navigate to public_html.

[ ] Delete the old assets folder (prevents "ghost" files from causing errors).

[ ] Upload the contents of your local /frontend/build folder.

[ ] Verification: Open the URL on your phone. If the Wind Dial center is empty (no "CALM" text), you’re live.

3. Android Version (The APK)
This moves the web code into the Android folder and packages it.

[ ] Sync Capacitor: Run npx cap sync android in your terminal.

[ ] Android Studio: Let the Gradle sync finish (wait for the green checkmark at the bottom).

[ ] Build APK: Go to Build > Build Bundle(s) / APK(s) > Build APK(s).

[ ] Locate: Click the blue 'Locate' link in the bottom-right popup.

[ ] Deploy: Send app-debug.apk to your device and install.

🛠 Field Repairs (Troubleshooting)
"My changes aren't showing up in the new APK!"
The Cause: You likely ran npx cap sync before running npm run build.

The Fix: Capacitor only copies what is already in the build folder. Re-run npm run build, then npx cap sync android, then rebuild the APK.

"Gradle Sync Failed" in Android Studio
The Cause: Often a temporary cache conflict or a plugin hiccup.

The Fix: Go to File > Invalidate Caches... > Invalidate and Restart. If that fails, ensure your internet connection is active so Gradle can download required dependencies.

"Hostinger shows the old version of the app"
The Cause: Browser caching. Your phone is "remembering" the old files to save data.

The Fix: Force refresh the page on your mobile browser, or clear the "Site Data" in your browser settings. If you use a CDN like Cloudflare, remember to "Purge Cache."

"SQL query returns 'No rows returned' in Supabase"
The Cause: Usually a case-sensitivity issue or the data is still sitting in the offline queue.

The Fix: 1.  Use ILIKE instead of = for email lookups.
2.  Check the app's Dashboard for the "OFFLINE MODE" or "SYNCING..." badge.
3.  Manually trigger a sync using the Refresh button in the app.