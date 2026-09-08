# UpayaHub
# Later Refine it, also add a proper landing page for the website so it usable

**Know Before You Go.** A crowdsourced accessibility map for Malaysia.

Wheelchair users, blind travellers, and parents with strollers across Malaysia regularly arrive somewhere only to find the ramp blocked or the lift out of service. UpayaHub lets anyone photograph an accessibility feature, have an AI verify what it shows and what condition it is in, and publish that to a live map — with community voting deciding what the map actually says.

**Live:** https://upayahub.syamxm.com

---

## Status at a glance

| Area | State |
|---|---|
| Map, reporting, voting, leaderboard | Working |
| AI photo verification + stored report photos | Working, key server-side |
| Google sign-in | Working |
| Firestore security rules | Hardened, 20 emulator tests |
| Production deploy | Live on Cloudflare Workers |
| SOS broadcast | Working (in-app alerts, 2 km, 10 min, 3/day) |
| Rewards / vouchers | Working (points spend, admin-managed vouchers) |
| Email report to council | Gemini drafts it; **send is a stub** |
| Admin page | Prototype at `/#admin` (vouchers, Cyberjaya reset) |

Stubs are labelled in the UI. Nothing is faked silently.

---

## Features

### Working

**Five tabs** — Explore (map + list), Community (feed + stats), Report (submit), Features (SOS, civic dispatch, rewards), Profile (points, leaderboard, settings).

**Accessibility map**
Google Maps view, centred on Cyberjaya because that is where the seeded locations are — coverage is meant to grow across Malaysia as the community adds places. Seeded places carry admin-set default conditions ("Set by admin, not yet reported") until the first community report replaces them. Every location is a pin coloured by its *worst* tracked feature, so a place with a working lift but a blocked ramp still shows red. A legend explains the colours.

Four features are tracked per location: ramp, elevator, tactile paving, accessible toilet. Each has a condition of `usable`, `damaged`, `blocked`, or `unclear`.

Filter by condition, search by name, and sort by distance from your location.

**AI photo verification**
Upload a photo of a ramp, lift, tactile paving or accessible toilet. Gemini (`gemini-3.1-flash-lite`) returns a structured verdict: which feature it is, what condition it's in, a confidence score, and a one-line summary.

The same call also runs **AI-image detection** — it judges whether the photo is a real camera photograph or synthetic (AI generated, rendered, heavily manipulated), looking for warped signage text, implausible geometry, missing sensor noise, and similar tells. Photos flagged as synthetic, or scored under 0.6 confidence, are marked `needsReview` and never touch the map.

**Report photos**
The function also returns a shrunk copy of the photo (≤1024 px JPEG, made with `sharp`). It is saved to `reportPhotos/{reportId}` when the report is submitted, and anyone can open it from a **View photo** button on the report, on the map sheet and in the Community feed. Shrinking happens server-side on purpose: browser canvas output is not trustworthy (fingerprint blockers and GPU bugs both produce garbage).

**Asymmetric trust**
Warnings and all-clears are treated differently on purpose:

- A report that makes a feature *worse* (usable → blocked) applies to the map **immediately**. If someone says the ramp is blocked, other users should see that now.
- A report that makes a feature *better* (blocked → usable) is held as `pending` until **2 community confirmations**. Clearing a warning is the expensive mistake, so it costs more evidence.

**Community voting**
Each location shows its 10 most recent reports, and the Community tab shows the latest 50 across the city. Any signed-in user can confirm (👍) or dispute (👎) a report from either place — one vote per person, and you cannot vote on your own. Both rules are enforced in Firestore, not just hidden in the UI. When a pending report reaches 2 confirmations, it is promoted and the map updates.

**Freshness decay**
A feature confirmed more than **30 days** ago is marked stale and drops back to "unconfirmed" in the UI. Accessibility changes; old data stops claiming to be verified.

**Leaderboard and credibility**
Every report earns 1 EXP and 10 points. The leaderboard ranks contributors by EXP (then points) and shows a credibility score — the percentage of your reports that the community confirmed rather than disputed. EXP never drops; points are spent on vouchers.

**Civic dispatch**
The Civic panel ranks a location's reports worst-first, downloads them as CSV, and asks Gemini (via the `draftCouncilEmail` Cloud Function) to draft a formal complaint email to JKR with the CSV listed as an attachment. The compose screen is editable; "Send" is a prototype stub that issues a reference number and delivers nothing.

**Account controls**
Light/dark/system theme toggle. Account deletion re-authenticates with Google (hinted to the current account), strips your name and photo from every report you filed, and removes your user document.

**Google sign-in**
Firebase Auth with a Google popup. Reports carry your name and photo so credibility accrues to a real identity.

**SOS broadcast**
Share your location, pick what is happening, tap Broadcast. The `sendSos` Cloud Function enforces 3 alerts per account per day, finds opted-in helpers within 2 km, and creates an SOS document that only the requester and those helpers can read. It lasts 10 minutes. Helpers see a red banner anywhere in the app, can tap "I'm on my way" (first one wins) and open the spot in Google Maps; the requester sees who is coming and can cancel.

**Rewards and vouchers**
Points are spent on partner vouchers (local businesses and councils) in Features → Rewards; a redemption issues a `UH-XXXXXX` code into your wallet. Vouchers are added through the admin page.

**Admin page** (`/#admin`)
Prototype only, signed in with email/password. Add or delete vouchers (or load three sample partners), and **Reset to Cyberjaya places**, which wipes every location, report, vote and photo and seeds five Cyberjaya places with admin-set default conditions. The real gate is the Firestore rule on the admin email, not the form.

### Not built yet

Finished UI, missing server-side work:

| Feature | What's missing |
|---|---|
| **SOS push notifications** | Alerts reach helpers only while the app is open (plus a browser notification if the tab is in the background). Real push needs FCM and a service worker. |
| **Email to council** | Real mail delivery and an audit trail. Gemini drafting and the compose screen work; the send button is a stub. |

---

## Tech stack

| Layer | Choice |
|---|---|
| UI | React 19, Vite 8, Tailwind CSS v4 |
| Icons | lucide-react |
| Map | `@vis.gl/react-google-maps` (Google Maps JS API) |
| AI | Gemini `gemini-3.1-flash-lite` via **Firebase Cloud Functions** (callable, `asia-southeast1`) |
| Image resize | `sharp` inside the function |
| Data + auth | Firebase Firestore + Firebase Auth (Google provider; email/password for the admin only) |
| Hosting | Cloudflare Workers (static assets) |

The browser talks to Firestore directly, with security rules as the enforcement layer. Three callable functions cover what rules cannot: `checkPhoto` (Gemini + resize), `draftCouncilEmail` (Gemini), `sendSos` (nearby-helper fan-out and daily limit). The AI key never reaches the client.

### Why Gemini moved server-side

It used to be called straight from the browser with a `VITE_GEMINI_API_KEY`. Vite inlines every `VITE_` variable into the bundle as a literal string, so that key was readable by anyone who opened the site and billable against the project. It now lives in a Firebase secret, read only inside the function.

The function enforces: **auth required**, MIME allowlist (JPEG/PNG/WebP), 4 MB size cap, **20 checks per user per hour**, sanitised errors that never leak the key or upstream error bodies, and CORS restricted to the production origin plus localhost.

### Project layout

```
src/
  main.jsx                React entry
  App.jsx                 Auth gate, tab routing, location loading, top-level state
  firebase.js             Firebase app + auth init from env vars
  db.js                   Firestore handle
  session.js              Profile sync, location loading
  account.js              Account deletion + report redaction
  theme.js                Light/dark/system theme
  conditions.js           Condition model: colours, severity, freshness, pin SVGs
  distance.js             Haversine distance for "nearest places"
  verifyPhoto.js          Calls the checkPhoto Cloud Function
  submitReport.js         Writes report + photo, awards points, applies or holds updates
  votes.js                Vote writes + promotion at 2 confirmations
  feed.js                 Community feed + aggregate stats
  leaderboard.js          EXP, points + credibility aggregation
  rewards.js              Vouchers, wallet, redemption batch
  sos.js                  sendSos call, live SOS/alert watchers, helper opt-in
  draftEmail.js           Calls the draftCouncilEmail Cloud Function
  places.js               Cyberjaya seed data + admin reset
  reporter.js             Anonymous-reporter display fallback
  exportReport.js         CSV generation + download
  screens/                Explore, Report, Community, Profile, Features, Admin
  features/               SosPanel, RewardsPanel, CivicPanel
  ui/                     Shared components: Button, Card, Modal, BottomSheet, …
  AccessibilityMap.jsx    Google Map + condition-coloured markers + your-location dot
  PhotoVerifier.jsx       Upload → verify → submit flow
  ReportList.jsx          Recent reports with confirm/dispute + View photo
  ReportPhoto.jsx         View photo button + modal
  LocationDetails.jsx     Bottom sheet: per-feature state + provenance

functions/
  index.js                checkPhoto, draftCouncilEmail, sendSos callables
  validation.js           Image input validation
  validation.test.js      Validation tests

docs/report-flow.png      Report journey flowchart (presentation)
firestore.rules           Security rules (the real backend)
rules.test.js             20 rules tests against the Firestore emulator
wrangler.jsonc            Cloudflare Workers static-asset config
```

### Firestore collections

| Collection | Shape |
|---|---|
| `locations` | `name`, `category`, `lat`, `lng`, and per-feature objects `ramp` / `elevator` / `tactilePaving` / `accessibleToilet` = `{ condition, confirmations, lastVerified, sourceReportId }` |
| `reports` | `locationId`, `locationName`, `reporterId`, `reporterName`, `reporterPhoto`, `featureType`, `field`, `condition`, `confidence`, `summary`, `looksSynthetic`, `syntheticConfidence`, `needsReview`, `pending`, `hasPhoto`, `createdAt` |
| `reportPhotos` | doc id is the report id; `reporterId`, `data` (JPEG data URL, max 1024px), `createdAt`. Loaded only when someone presses "View photo". |
| `votes` | doc id is `{reportId}_{userId}`; fields `reportId`, `voterId`, `value` (1 or -1), `createdAt` |
| `users` | `name`, `photo`, `points`, `reportCount`, `lastReportId`, `lastRedemptionId` |
| `users/{uid}/redemptions` | `voucherId`, `partner`, `title`, `code`, `cost`, `createdAt`. Owner-only. |
| `vouchers` | `partner`, `title`, `description`, `cost`, `createdAt`. Written only by the admin account. |
| `photoCheckLimits` | Per-user rate-limit counters. Written only by the Cloud Function; **closed to all clients**. |
| `sosLimits` | Per-user daily SOS counters. Function-only; **closed to all clients**. |
| `helpers` | `lat`, `lng`, `updatedAt` for users who opted in to help. Owner read/write only; the function reads them. |
| `sos` | `requesterId`, `requesterName`, `situation`, `note`, `lat`, `lng`, `alertedIds`, `helperId`, `helperName`, `cancelled`, `createdAt`, `expiresAt`. Created only by the function. |

### What the rules enforce

- Reading anything requires sign-in. Signed-out users get nothing.
- **Reports** must carry the caller's own uid, reference a location that exists, use valid enums, keep `confidence` in 0–1, and pass a field allowlist. Critically, `needsReview` must equal `looksSynthetic || confidence < 0.6` — a client cannot mark a flagged photo as clean.
- **Votes** are create-only, one per person per report, cannot be cast on your own report, and cannot be edited or deleted.
- **Locations** change only on the four feature fields, and only when backed by a real report whose condition matches. Only the admin account can create or delete locations, reports, votes and photos (used by the "Reset to Cyberjaya places" button).
- **Report photos** can only be written by the owner of the matching report, are capped at 1 MB, and can never be edited.
- **Points** require a fresh report you actually own. The user document stores `lastReportId`; a points write must reference a report that exists, belongs to you, and differs from the one already recorded — so the same write cannot be replayed for free points.
- **Vouchers** can only be created or deleted by the account whose email is `admin_upayahub@upayahub.app`.
- **Redemptions** are written in one batch with the points deduction. The redemption must copy the voucher's real cost, and the user document must point at it via `lastRedemptionId` in the same batch — neither half can land alone, and points cannot go negative.
- **SOS** docs are readable only by the requester and the helpers the function listed in `alertedIds`. An alerted helper may set `helperId` to their own uid once, while the SOS is live and unclaimed; the requester may only set `cancelled`. Nobody else can read the location.
- Everything not explicitly matched is denied by a catch-all rule.

Known limits, so nobody is surprised: the `+10` points value is hardcoded in the rules and duplicated in `conditions.js`, and rules cannot judge photo *quality* — only that a real report exists. Moving the report write into the Cloud Function would close that.

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
4. Under Authentication → **Settings → Authorised domains**, confirm `localhost` is listed.
5. **Project settings (gear icon) → Your apps → Web app (`</>`)**. Register the app and copy the `firebaseConfig` values — you need them in step 5.

Cloud Functions require the **Blaze (pay-as-you-go)** plan. The free tier covers development use comfortably, but a card must be on file.

### 4. Get the Google API keys

**Google Maps JavaScript API**

1. In the [Google Cloud console](https://console.cloud.google.com/), select the same project Firebase created.
2. **APIs & Services → Library → Maps JavaScript API → Enable.**
3. **APIs & Services → Credentials → Create credentials → API key.**
4. Restrict it: **Application restrictions → Websites**, and add both `http://localhost:5173/*` and `http://localhost:5174/*`. Under **API restrictions**, limit it to Maps JavaScript API.

> The dev server uses port 5173, or 5174 if 5173 is already taken. Allow both referrers or the map silently fails to load.

**Gemini API**

Create a key at [Google AI Studio](https://aistudio.google.com/apikey). **This key never goes in `.env.local`.** It is set as a Firebase secret in step 6.

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
```

All seven come from the Firebase `firebaseConfig` object in step 3.5, plus the Maps key from step 4. There is deliberately **no Gemini variable here** — see step 6.

To create the file:

- **Linux / macOS** — `touch .env.local` then edit it
- **Windows (PowerShell)** — `New-Item .env.local` then edit it

Vite only exposes variables prefixed `VITE_`, and it reads `.env.local` at startup — restart the dev server after any change.

### 6. Deploy the Cloud Function

Photo verification will not work until this is live.

```bash
npm install -g firebase-tools
firebase login
firebase use --add                              # pick your project
cd functions && npm install && cd ..
firebase functions:secrets:set GEMINI_API_KEY   # paste the key from step 4
firebase deploy --only functions
```

Deploys three callables (`checkPhoto`, `draftCouncilEmail`, `sendSos`) to `asia-southeast1` (Singapore). The client pins the same region in `src/verifyPhoto.js`, `src/draftEmail.js` and `src/sos.js` — if you change one, change all. The first deploy pulls `sharp`'s native binary, so it takes a little longer.

If the first call returns 403, grant public invoker so the request can reach the function's own auth check:

```bash
gcloud run services add-iam-policy-binding checkphoto \
  --region=asia-southeast1 --member=allUsers --role=roles/run.invoker
```

### 7. Deploy the Firestore rules

The app cannot write anything until the rules in `firestore.rules` are live.

Either paste the contents of `firestore.rules` into **Firestore → Rules** in the Firebase console and click Publish, or use the CLI:

```bash
firebase deploy --only firestore:rules
```

`.firebaserc` currently points at the project alias `upayahub`; `firebase use --add` will repoint it at yours.

### 8. Seed the locations

Do step 9 first (admin account), then open `/#admin` and press **Reset to Cyberjaya places**. That wipes every location, report, vote and photo and adds five Cyberjaya places (MMU, Shaftsbury Square, DPulze, Cyberjaya Lake Park, Masjid Raja Haji Fi Sabilillah) with admin-set default conditions. The list lives in `src/places.js`; coordinates are approximate, so nudge them in the Firestore console if a pin looks off.

To add a place by hand instead, create a document in `locations` with `name`, `category`, `lat`, `lng`. Feature fields are optional — anything absent shows as "No reports yet" and gets filled in by the first verified report.

### 9. Create the admin account

In **Authentication → Sign-in method**, enable **Email/Password**. Then in **Authentication → Users → Add user**, create `admin_upayahub@upayahub.app` with password `pwd12345678`. The rules gate voucher writes and the places reset on that exact email.

Open `/#admin`, sign in with username `admin_upayahub` and that password, and either add vouchers by hand or press **Add samples** for three fake partners.

### 10. Run it

```bash
npm run dev
```

Open the printed URL (usually http://localhost:5173). Sign in with Google, tap a pin, and upload a photo of a ramp or lift to try the verification flow.

### Scripts

```bash
npm run dev        # dev server
npm run build      # production build into dist/
npm run preview    # serve the production build locally
npm run lint       # eslint (covers src/ and functions/)
npm test           # unit tests: scoring, tokens, CSV export
npm run test:rules # 20 Firestore rules tests against the emulator
```

`test:rules` needs **Java 21+**. If your default JDK is older:

```bash
JAVA_HOME=/usr/lib/jvm/java-21-openjdk PATH=/usr/lib/jvm/java-21-openjdk/bin:$PATH npm run test:rules
```

Function tests run separately: `cd functions && npm test`.

---

## Production deployment

Hosted on **Cloudflare Workers** with static assets, built from `main` by Workers Builds.

### Cloudflare setup

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Output | `dist` (set in `wrangler.jsonc`) |
| Node version | `.node-version` → `24` |
| SPA fallback | `not_found_handling: "single-page-application"` |

**Build variables** live in **Settings → Builds → Variables and secrets** — *not* the runtime "Variables and Secrets" panel, which a static-asset-only Worker cannot use. Add the same seven `VITE_*` variables from step 5, as type **Variable**.

They are Variables rather than Secrets on purpose: every `VITE_` value is compiled into the public JS bundle regardless, so marking them Secret hides them from your own dashboard while changing nothing about their exposure. Their real protection is the API key referrer restrictions below.

Build variables apply at **build time only** — after changing one you must trigger a new deployment. An existing deployment stays broken no matter how often you refresh.

### Custom domain

Attach it from the Worker: **Settings → Domains & Routes → Add → Custom Domain**. Do **not** hand-create a proxied CNAME pointing at `*.workers.dev` — Cloudflare then treats it as an origin it must reach over HTTP and you get a 522.

### API key restrictions

Firebase browser key — **Websites**:

```
https://upayahub.syamxm.com/*
https://upayahub.firebaseapp.com/*
https://upayahub.web.app/*
http://localhost:5173/*
http://localhost:4173/*
```

The two `firebaseapp.com` / `web.app` entries are **required**. Google sign-in redirects through `upayahub.firebaseapp.com/__/auth/handler`, which calls Identity Toolkit with the same key from *that* origin. Omit them and sign-in fails with "The requested action is invalid."

API restrictions: Identity Toolkit, Token Service, Cloud Firestore, Cloud Functions.

Maps browser key — same website list, API restrictions limited to **Maps JavaScript API only**.

Gemini server key — **no** referrer restriction (Cloud Functions has no stable referrer or egress IP), restricted to the **Generative Language API**, used only by the function.

### Firebase authorised domains

Add the production domain under **Authentication → Settings → Authorised domains**, or Google sign-in fails with `auth/unauthorized-domain`.

### Deploy order

1. Set the Gemini secret, `firebase deploy --only functions`
2. `firebase deploy --only firestore:rules`
3. Merge to `main` → Cloudflare builds automatically

Rules before the site: the current rules reject the old `submitReport` write shape, so a stale cached bundle fails to award points until it reloads.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| Blank page, dark background, nothing renders | Build variables missing, so Firebase config compiled to `undefined` and `initializeApp` threw. Check the deployed bundle for `projectId:void 0`. |
| Sign-in popup shows "The requested action is invalid." | `upayahub.firebaseapp.com/*` missing from the Firebase key's referrer list. |
| Sign-in popup opens then closes | Google provider not enabled, or the domain missing from Authorised domains. Also check the browser isn't blocking popups. |
| Error 522 on the custom domain | A hand-made CNAME to `*.workers.dev`. Delete it and attach the domain from the Worker instead. |
| Map area is blank/grey | Maps key missing, Maps JavaScript API not enabled, or the referrer restriction doesn't include your actual port. |
| No pins on the map | The `locations` collection is empty — see step 8. |
| "Reset to Cyberjaya places" fails | Rules not redeployed (step 7), or you're signed in as a normal user rather than the admin. |
| "Missing or insufficient permissions" | Firestore rules not deployed (step 7), or you're signed out. |
| Photo check always fails | Function not deployed, `GEMINI_API_KEY` secret not set, or you've hit 20 checks in an hour. |
| "View photo" shows stripes or noise | Old client-side resize. Redeploy functions; photos are now shrunk server-side. |
| Location button seems dead | Browser blocked geolocation. An error banner over the map now says so; allow location in site settings. |
| Photo check fails only on preview deploys | Preview URLs aren't in the function's CORS allowlist. Add the hostname to `allowedOrigins` in `functions/index.js`. |
| Changed `.env.local`, nothing happened | Restart `npm run dev`. Vite reads env files only at startup. |

---

## Contributing

Branch off `main`, open a PR — no direct pushes. Branch names: `feature/`, `fix/`, `refactor/`, `chore/`, `docs/`.

Before opening a PR run `npm run lint`, `npm test`, and `npm run test:rules` if you touched `firestore.rules`.
