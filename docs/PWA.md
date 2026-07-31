# PWA Architecture & Manual QA Manual

## 1. Overview
Zury features a Progressive Web Application (PWA) setup designed for fast web navigation and reliable offline fallback.

- **Web App Manifest**: [apps/web/src/app/manifest.ts](file:///home/monaski/dev/zury/apps/web/src/app/manifest.ts)
- **Service Worker**: [apps/web/public/sw.js](file:///home/monaski/dev/zury/apps/web/public/sw.js)
- **Offline Fallback Route**: [apps/web/src/app/offline/page.tsx](file:///home/monaski/dev/zury/apps/web/src/app/offline/page.tsx)

---

## 2. Installation & Standalone Mode

### iOS (Safari)
1. Open the deployed application URL in Safari.
2. Tap the **Share** button on the browser toolbar.
3. Select **Add to Home Screen**.
4. Launch Zury from the Home Screen to test standalone window rendering without browser chrome.

### Android (Chrome)
1. Open the application URL in Google Chrome.
2. Tap the overflow menu (three dots) or click the inline install banner.
3. Select **Install App**.
4. Confirm standalone launch from the home screen / app drawer.

---

## 3. Offline Capabilities & Strategy

1. **Pre-cached Assets**: Static shell page `/offline` and application icon `/icon.svg`.
2. **Navigation Fallback**: If a navigation request fails while offline, the service worker intercepts network failure and serves `/offline`.
3. **Static Resource Caching**: Successful `GET` responses are cached dynamically to `zury-shell-v1-static`.
4. **Conversation drafts and pending messages**: Authenticated user-scoped
   IndexedDB records preserve drafts and outgoing Conversation messages. A
   pending message is sent in creation order after connectivity returns using
   its original client message ID. Calendar confirmations remain online-only.

The dashboard exposes `Online` or `Offline` with a pending-message count. User
messages show `Waiting for connection`, `Sending`, `Sent`, or `Couldn't send`.
Logging out clears only the signed-in user's local records.

---

## 4. Browser Support & Compatibility

| Platform | Primary Browser | Standalone Mode | Offline SW | Safe Area Handling |
| :--- | :--- | :--- | :--- | :--- |
| **iOS / iPadOS** | Safari | Supported | Supported | `env(safe-area-inset-bottom)` applied |
| **Android** | Chrome | Supported | Supported | Navigation Bar padding respected |
| **macOS / Windows** | Chrome / Edge | Supported (Desktop PWA) | Supported | Window frame titlebar fallback |

---

## 5. Manual QA Test Suite

### Test Case 1: Standalone Installation & Icon Quality
- **Action**: Install PWA on Chrome / Safari.
- **Expected Result**: App renders without browser URL bar; icon displays sharp edges and correct safe-zone padding in maskable / circular launcher frames.

### Test Case 2: Offline Navigation Fallback
- **Action**: Open DevTools > Network tab > toggle **Offline**. Navigate to any page.
- **Expected Result**: Clean offline fallback page loads without default browser crash error screen.

### Test Case 3: Mobile Safe-Area Insets
- **Action**: Test mobile landscape and portrait on devices with home indicator notches (iPhone 13/14/15/16).
- **Expected Result**: Floating bottom navigation bar remains accessible without overlap by the native iOS home bar.
