<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/68109457-d816-4097-81e9-0fc3943ed8b1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
   - For Android APK testing, also set `VITE_API_BASE_URL` (or `VITE_ANDROID_API_BASES`) to a backend URL reachable from the device/emulator.
   - `localhost` only works on the same machine; Android emulators typically need `http://10.0.2.2:3000`, and physical phones need your computer's LAN IP or HTTPS URL.
3. Run the app:
   `npm run dev`
