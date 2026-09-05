# UpayaHub

**Know Before You Go.** A crowdsourced accessibility map for Malaysia.

Wheelchair users, blind travellers, and parents with strollers across Malaysia regularly arrive somewhere only to find the ramp blocked or the lift out of service. UpayaHub lets anyone photograph an accessibility feature, have an AI verify what it shows and what condition it is in, and publish that to a live map — with community voting deciding what the map actually says.

---

## Features

**Accessibility map**
Google Maps view, currently centred on Kuala Lumpur because that is where the seeded locations are — coverage is meant to grow across Malaysia as the community adds places. Every location is a pin coloured by its *worst* tracked feature, so a place with a working lift but a blocked ramp still shows red. A legend explains the colours.

Four features are tracked per location: ramp, elevator, tactile paving, accessible toilet. Each has a condition of `usable`, `damaged`, `blocked`, or `unclear`.

**AI photo verification**
Upload a photo of a ramp, lift, tactile paving or accessible toilet. Gemini (`gemini-3.1-flash-lite`) returns a structured verdict: which feature it is, what condition it's in, a confidence score, and a one-line summary.

The same call also runs **AI-image detection** — it judges whether the photo is a real camera photograph or synthetic (AI generated, rendered, heavily manipulated), looking for warped signage text, implausible geometry, missing sensor noise, and similar tells. Photos flagged as synthetic, or scored under 0.6 confidence, are marked `needsReview` and never touch the map.

**Asymmetric trust**
Warnings and all-clears are treated differently on purpose:

- A report that makes a feature *worse* (usable → blocked) applies to the map **immediately**. If someone says the ramp is blocked, other users should see that now.
- A report that makes a feature *better* (blocked → usable) is held as `pending` until **2 community confirmations**. Clearing a warning is the expensive mistake, so it costs more evidence.

**Community voting**
Each location shows its 10 most recent reports. Any signed-in user can confirm (👍) or dispute (👎) a report — one vote per person, and you cannot vote on your own. When a pending report reaches 2 confirmations, it is promoted and the map updates.

**Freshness decay**
A feature confirmed more than **30 days** ago is marked stale and drops back to "unconfirmed" in the UI. Accessibility changes; old data stops claiming to be verified.

**Leaderboard and credibility**
10 points per report submitted. The leaderboard ranks contributors by points and shows a credibility score — the percentage of your reports that the community confirmed rather than disputed.

**Google sign-in**
Firebase Auth with a Google popup. Reports carry your name and photo so credibility accrues to a real identity.

---

## Tech stack

| Layer | Choice |
|---|---|
| UI | React 19, Vite 8, Tailwind CSS v4 |
| Icons | lucide-react |
| Map | `@vis.gl/react-google-maps` (Google Maps JS API) |
| AI | `@google/genai` — Gemini, called from the browser |
| Data + auth | Firebase Firestore + Firebase Auth (Google provider) |

There is no backend server. The browser talks to Firestore and Gemini directly; Firestore security rules are the enforcement layer.

### Project layout

```
src/
  main.jsx              React entry
  App.jsx               Auth gate, location loading, top-level state
  firebase.js           Firebase app / db / auth init from env vars
  conditions.js         Condition model: colours, severity, freshness, pin SVGs
  AccessibilityMap.jsx  Google Map + condition-coloured markers
  MapLegend.jsx         Colour key overlay
  LocationDetails.jsx   Bottom sheet: per-feature state + provenance
  PhotoVerifier.jsx     Upload → verify → submit flow
  verifyPhoto.js        Gemini call, JSON schema, AI-image detection prompt
  submitReport.js       Writes reports, awards points, applies or holds updates
  ReportList.jsx        Recent reports with confirm/dispute buttons
  votes.js              Vote writes + promotion at 2 confirmations
  Leaderboard.jsx       Ranked contributors modal
  leaderboard.js        Points + credibility aggregation
  SignIn.jsx            Google sign-in screen
  Avatar.jsx            User avatar with initial fallback
firestore.rules         Security rules (the real backend)
```

### Firestore collections

| Collection | Shape |
|---|---|
| `locations` | `name`, `category`, `lat`, `lng`, and per-feature objects `ramp` / `elevator` / `tactilePaving` / `accessibleToilet` = `{ condition, confirmations, lastVerified }` |
| `reports` | `locationId`, `reporterId`, `featureType`, `condition`, `confidence`, `summary`, `looksSynthetic`, `needsReview`, `pending`, `createdAt` |
| `votes` | doc id is `{reportId}_{userId}`; fields `reportId`, `voterId`, `value` (1 or -1), `createdAt` |
| `users` | `name`, `photo`, `email`, `points`, `reportCount` |

Rules enforce: read requires sign-in; `locations` can only be updated on the four feature fields with a valid condition; reports and votes are create-only and must carry the caller's own uid; a user can never award themselves more than 10 points in a single write; nothing can be deleted.

---

## Running it locally

Works the same on **Linux, macOS, and Windows**. Where a command differs, both are shown.

### 1. Install Node.js

You need **Node.js 20.19+ or 22.12+** (Vite 8 requires it). Verify:

```bash
node -v
npm -v
```

If missing or too old:

- **Linux** — install via [nvm](https://github.com/nvm-sh/nvm): `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash`, restart the shell, then `nvm install 22`
- **macOS** — `brew install node`, or the same nvm steps above
- **Windows** — download the LTS installer from [nodejs.org](https://nodejs.org/), or use [nvm-windows](https://github.com/coreybutler/nvm-windows)

### 2. Get the code

```bash
git clone https://github.com/syamxm/upayahub.git
cd upayahub
npm install
```

On Windows use PowerShell or Git Bash — both work fine.

### 3. Create a Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com/) → **Add project**.
2. **Build → Firestore Database → Create database**. Start in production mode; the rules in this repo will replace the defaults.
3. **Build → Authentication → Get started → Sign-in method → Google → Enable.**
4. Under Authentication → **Settings → Authorized domains**, confirm `localhost` is listed.
5. **Project settings (gear icon) → Your apps → Web app (`</>`)**. Register the app and copy the `firebaseConfig` values — you need them in step 5.

### 4. Get the Google API keys

**Google Maps JavaScript API**

1. In the [Google Cloud console](https://console.cloud.google.com/), select the same project Firebase created.
2. **APIs & Services → Library → Maps JavaScript API → Enable.**
3. **APIs & Services → Credentials → Create credentials → API key.**
4. Restrict it: **Application restrictions → Websites**, and add both `http://localhost:5173/*` and `http://localhost:5174/*`. Under **API restrictions**, limit it to Maps JavaScript API.

> The dev server uses port 5173, or 5174 if 5173 is already taken. Allow both referrers or the map silently fails to load.

**Gemini API**

Create a key at [Google AI Studio](https://aistudio.google.com/apikey).

> Note: the Gemini key is used directly from the browser, so it is visible to anyone who opens the site. That is fine for local development and a demo. Before any public deployment, move the Gemini call behind a server function and keep the key there.

### 5. Add environment variables

Create a file named `.env.local` in the project root. It is gitignored — never commit it.

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_GOOGLE_MAPS_API_KEY=...
VITE_GEMINI_API_KEY=...
```

The first six come from the Firebase `firebaseConfig` object in step 3.5.

To create the file:

- **Linux / macOS** — `touch .env.local` then edit it
- **Windows (PowerShell)** — `New-Item .env.local` then edit it

Vite only exposes variables prefixed `VITE_`, and it reads `.env.local` at startup — restart the dev server after any change.

### 6. Deploy the Firestore rules

The app cannot write anything until the rules in `firestore.rules` are live.

Either paste the contents of `firestore.rules` into **Firestore → Rules** in the Firebase console and click Publish, or use the CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use --add          # pick your project
firebase deploy --only firestore:rules
```

`.firebaserc` currently points at the project alias `upayahub`; `firebase use --add` will repoint it at yours.

### 7. Seed at least one location

The rules deliberately forbid creating locations from the app (`allow create: if false`), so add them by hand in **Firestore → Data → Start collection**:

- Collection ID: `locations`
- Document ID: auto
- Fields:

| Field | Type | Example |
|---|---|---|
| `name` | string | `KL Sentral` |
| `category` | string | `Transit hub` |
| `lat` | number | `3.1339` |
| `lng` | number | `101.6869` |

Feature fields are optional — anything absent shows as "No reports yet" and gets filled in by the first verified report.

### 8. Run it

```bash
npm run dev
```

Open the printed URL (usually http://localhost:5173). Sign in with Google, tap a pin, and upload a photo of a ramp or lift to try the verification flow.

### Other scripts

```bash
npm run build      # production build into dist/
npm run preview    # serve the production build locally
npm run lint       # eslint
```

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| Map area is blank/grey | Maps key missing, Maps JavaScript API not enabled, or the referrer restriction doesn't include your actual port. Check the browser console. |
| Sign-in popup opens then closes | Google provider not enabled in Firebase Auth, or `localhost` missing from Authorized domains. Also check the browser isn't blocking popups. |
| No pins on the map | The `locations` collection is empty — see step 7. |
| "Missing or insufficient permissions" | Firestore rules not deployed (step 6), or you're signed out. |
| Photo upload errors | Gemini key missing or invalid, or you've hit the free-tier rate limit. The error text is shown under the file input. |
| Changed `.env.local`, nothing happened | Restart `npm run dev`. Vite reads env files only at startup. |
