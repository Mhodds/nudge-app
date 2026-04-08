# 🏉 RUCK KICK COMMAND PLAYBOOK

## 🚀 Daily Development
**Start the laptop preview:**
`npm run dev`

## 📱 Pushing to S24 Ultra
**Step 1: Build the app engine**
`npm run build`

**Step 2: Sync to Android folder**
`npx cap sync`

*Note: After this, go to Android Studio and hit the Green Play Button.*

## ☁️ Saving to GitHub
`git add .`
`git commit -m "Describe your changes here"`
`git push origin main`

## 🛠️ Maintenance
**Back to frontend folder:**
`cd lovable-ui-showcase-main\frontend`
# 🏉 Nudge Check — Deploy Playbook

---

## 🖥️ Daily Dev (Local Preview)

```bash
cd lovable-ui-showcase-main\frontend
npm run dev
```

Opens the app in your browser at localhost for testing.

---

## ☁️ Save to GitHub (VS Code)

Either use the terminal or VS Code's Source Control panel.

**Terminal:**
```bash
git add .
git commit -m "Describe your changes here"
git push origin main
```

**VS Code Source Control (no terminal):**
1. Press `Ctrl+Shift+G` to open Source Control
2. Click **+** next to Changes to stage everything
3. Type your commit message in the box
4. Click **Commit** then **Sync Changes**

---

## 📱 Push Update to Android (S24 Ultra)

```bash
npm run build
npx cap sync
```

Then open **Android Studio** and hit the **green Play button** to install on your device.

> **What these do:**
> - `npm run build` — compiles your web app into the `/dist` folder
> - `npx cap sync` — copies that build into the Android project and syncs any plugin changes
> - Android Studio play button — builds the APK and pushes it to your connected S24 Ultra

---

## 🌐 Push Update to Hostinger (iPhone PWA)

iPhone users access Nudge Check as a PWA from your hosted URL — so every time you deploy to Hostinger, they get the latest version on next load.

**Step 1: Build the app**
```bash
npm run build
```
This generates your production files in the `/dist` folder (or `/build` — check your config).

**Step 2: Upload to Hostinger**

1. Go to [hpanel.hostinger.com](https://hpanel.hostinger.com)
2. **Hosting → Manage → File Manager**
3. Navigate to `public_html` (or your app's subfolder)
4. Select all files in your local `/dist` folder and upload
5. Confirm overwrite when prompted

> **After deploying:** Open your PWA URL in Safari on iPhone, do a hard reload, and check the update is live.

---

## 🔁 Full Deploy Order (Quick Reference)

```
1. npm run build
2. git add . → git commit → git push
3. Upload /dist to Hostinger          ← iPhone PWA updates
4. npx cap sync → Android Studio ▶   ← Android updates
```

---

## 🛠️ Useful Shortcuts

| Task | Command |
|------|---------|
| Go to frontend folder | `cd lovable-ui-showcase-main\frontend` |
| Start local preview | `npm run dev` |
| Build for production | `npm run build` |
| Sync to Android | `npx cap sync` |
| Push to GitHub | `git add . → commit → push` |

---

_Last updated: April 2026_