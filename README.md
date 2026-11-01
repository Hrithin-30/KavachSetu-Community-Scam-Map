# KavachSetu — Community Scam Map (India)

**Mitigata Problem 03: Community Scam Map**  
A high-trust, privacy-first community scam reporting, real-time threat lookup, 7-day neighborhood heatmap, unusual spike alert, and anti-spoofing intelligence platform built for India.

---

## Table of Contents
1. [System Requirements & Prerequisites](#1-system-requirements--prerequisites)
2. [Step-by-Step Installation & Running Guide (From ZIP)](#2-step-by-step-installation--running-guide-from-zip)
3. [Pre-Configured Demo Credentials (Citizen & Admin)](#3-pre-configured-demo-credentials-citizen--admin)
4. [Complete Feature Walkthrough & UI Guide](#4-complete-feature-walkthrough--ui-guide)
5. [5-Layer Deterministic Trust Engine & Anti-Spoofing Rules](#5-5-layer-deterministic-trust-engine--anti-spoofing-rules)
6. [Same-ID Rate Limiting: 15-Second Server Gap & 2 Reports/Day Quota](#6-same-id-rate-limiting-15-second-server-gap--2-reportsday-quota)
7. [8-Vector Fake Report Attack Simulation (50 Reports Stress Test)](#7-8-vector-fake-report-attack-simulation-50-reports-stress-test)
8. [Strict Privacy & Zero-PII Architecture](#8-strict-privacy--zero-pii-architecture)
9. [Canonical Identifier Normalization Rules](#9-canonical-identifier-normalization-rules)
10. [Cryptographic Server Licence & 4-Step Live Judge Demo](#10-cryptographic-server-licence--4-step-live-judge-demo)
11. [Complete REST API Reference](#11-complete-rest-api-reference)
12. [Automated Verification & Testing Suite (21 Unit Tests + HTTP Script)](#12-automated-verification--testing-suite-21-unit-tests--http-script)
13. [Project Folder Structure](#13-project-folder-structure)
14. [Troubleshooting Guide](#14-troubleshooting-guide)

---

## 1. System Requirements & Prerequisites

- **Operating System**: Windows 10/11, macOS 12+, or Linux (Ubuntu/Debian/Fedora)
- **Node.js**: Version **18.x** or **20.x+** (LTS recommended) — Download from [https://nodejs.org/](https://nodejs.org/)
- **Package Manager**: `npm` (automatically installed with Node.js)
- **External Database / API Keys**: **None required.** The application uses a self-contained, deterministic in-memory engine (`TrustEngine`, `AuthManager`, `LicenseManager`) pre-seeded with realistic Bengaluru & pan-India cybercrime telemetry. It works 100% offline/locally out of the box.

To verify Node.js and npm are installed on your system:
```bash
node -v
npm -v
```

---

## 2. Step-by-Step Installation & Running Guide (From ZIP)

### Step 1: Extract the ZIP File
- **Windows**: Right-click the downloaded `.zip` file $\rightarrow$ **Extract All...** $\rightarrow$ Open **PowerShell** or **Command Prompt** inside the extracted folder.
- **macOS / Linux**:
  ```bash
  unzip kavachsetu.zip -d kavachsetu
  cd kavachsetu
  ```

### Step 2: Install Project Dependencies
Run the following command inside the project root directory (where `package.json` is located):
```bash
npm install
```

### Step 3: Start the Full-Stack Application (Development Mode)
```bash
npm run dev
```
- Starts both the **Express API backend** and the **React 19 + Vite frontend** on a single port:
- Open your browser and navigate to: **`http://localhost:3000`**

### Step 4: Production Build & Start (Optional)
If you want to compile the frontend assets for production and serve the built bundle via Express:
```bash
# 1. Compile TypeScript & bundle React production assets into dist/
npm run build

# 2. Start the production server on port 3000
NODE_ENV=production npm start
```
*(On Windows PowerShell, use: `$env:NODE_ENV="production"; npm start`)*

---

## 3. Pre-Configured Demo Credentials (Citizen & Admin)

You can use the platform **anonymously without logging in**, or sign in using the pre-configured accounts via the **Sign In** button or **Admin Portal** button in the top navigation bar:

| Role | Email | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **Citizen Account 1** | `rahul@citizen.in` | `Citizen@123` | Submit scam reports, track personal submitted cases, generate 1930 FIR drafts |
| **Citizen Account 2** | `neha@citizen.in` | `Citizen@123` | Test multi-user corroboration across distinct citizen accounts |
| **I4C / Cyber Cell Admin** | `admin@kavachsetu.gov.in` | `Admin@1930#Kavach` | Access **Admin Portal**, review audit logs, inspect blocked/collapsed reports, manage allowlist, run 21 tests & 8-vector attack simulations, and reset demo data |

---

## 4. Complete Feature Walkthrough & UI Guide

1. **Instant Threat Lookup (`Lookup` Tab)**:
   - Search any phone number (`+91 98765 43210`), UPI ID (`ramesh.collect@okaxis`), URL (`https://sbi-kyc-update.in/login`), or SMS Header (`VM-HDFCBK`).
   - Returns instant status:
     - `VERIFIED_BUSINESS` (Green Shield — Protected official helpline, bank, or verified local shop)
     - `KNOWN_SCAM` (Red Alert — Confirmed by $\ge 3$ distinct trusted reporters; full identifier unmasked)
     - `SUSPICIOUS` (Amber Warning — 1 or 2 distinct trusted reporters; identifier masked for privacy)
     - `UNREPORTED` (Neutral — 0 trusted reports)
2. **Anonymous Scam Report Form (`Report a Scam` Button)**:
   - Zero-PII submission form requiring only: Identifier, Channel (`CALL`, `SMS`, `WHATSAPP`, `UPI`, `URL`, `EMAIL`), Scam Category (`UPI_COLLECT`, `KYC_FREEZE`, `DIGITAL_ARREST`, `PARCEL_CUSTOMS`, `ELECTRICITY_BILL`, `JOB_TASK`, `INVESTMENT_GROUP`, `FAKE_CUSTOMER_CARE`), 6-digit Neighborhood PIN Code, and Incident Description (`note`).
   - Enforces client-side validation + server-side **Zero-Empty-Shell** protection, **15-second server gap**, and **2 reports/day per ID quota**.
3. **7-Day Neighborhood Heatmap (`Area Heatmap` Tab)**:
   - Interactive SVG choropleth & node map of 8 Bengaluru postal zones (`560001` MG Road, `560034` Koramangala, `560038` Indiranagar, `560066` Whitefield, `560102` HSR Layout, `560100` Electronic City, `560011` Jayanagar, `560064` Yelahanka) + pan-India PIN support.
   - Displays 7-day report volume, top scam category, top channel, and active spike warnings per PIN code.
4. **Unusual Spike Alerts (`Spike Alerts` Tab)**:
   - Compares the **last 24 hours** of trusted reports in each PIN code and scam category against the **previous 6-day daily average**.
   - Flags an active spike when `last_24h >= 3` and `multiplier >= 2.0x` (e.g., *KYC Freeze surge in 560102 HSR Layout*).
5. **Case Tracker & 1930 FIR Draft Generator (`Track Case` Tab)**:
   - Every valid report generates a trackable Case ID (e.g., `CASE-2026-1001`).
   - Citizens can track corroboration progress (`1/3`, `2/3`, `3/3 Confirmed`) and download a formatted **National Cyber Crime Portal (1930)** incident summary.
6. **I4C Admin Portal (`Admin Portal` Button)**:
   - View full system telemetry, inspect every accepted and collapsed report with exact `collapse_reason`, add/remove protected businesses on the Allowlist, trigger the **8-Vector Fake Report Attack Simulation**, or reset the database to clean demo state.

---

## 5. 5-Layer Deterministic Trust Engine & Anti-Spoofing Rules

Located in `src/engine/trustEngine.ts`, every incoming report passes through 5 strict anti-spoofing layers before it can increment `distinct_reporters` or affect the heatmap:

### Layer 1: Official Allowlist & Local Business Protection (Appendix C)
- Protects public helplines (`1930`, `1909`, `112`), bank toll-free numbers (`1800 1600`, `1800 1234`, `1860 419 5555`), official bank SMS headers (`HDFCBK`, `SBIINB`, `ICICIB`, `AXISBK`), government portals (`https://cybercrime.gov.in`, `https://sancharsaathi.gov.in`), and verified local businesses (`+91 80 4100 2233` & `freshbakes@okaxis` for *Fresh Bakes, Indiranagar*; `+91 80 2553 0190` for *Koramangala Pharmacy*).
- Even if attackers submit 40 fake reports against an allowlisted identifier, `GET /lookup` **always** returns `VERIFIED_BUSINESS` and `collapse_reason: 'ALLOWLIST_PROTECTED'`.

### Layer 2: Same Reporter / Same Account Deduplication (`SAME_REPORTER_DUPLICATE`)
- Tracks both `reporter_id` (device/session hash) and authenticated `user_id` (account).
- Even if a logged-in user switches browsers/devices (`reporter_id` changes) or re-submits for the same target, their duplicate reports are collapsed (`is_trusted_distinct = false`, `trust_weight = 0`). One person = **1 distinct reporter**.

### Layer 3: Same Wi-Fi / `/24` IPv4 Subnet Sybil Defense (`SAME_SUBNET_24H_BURST` & `COORDINATED_AREA_FLOOD_COLLAPSED`)
- Extracts the `/24` IPv4 prefix (first 3 octets, e.g. `103.21.58` from `103.21.58.140`).
- **Rule A (`SAME_SUBNET_24H_BURST`)**: If 22 fake accounts on the same home/office Wi-Fi (`/24` subnet) report the same target within 24 hours, report #1 counts as `1` distinct reporter and reports #2–#22 are collapsed (`trust_weight = 0`).
- **Rule B (`COORDINATED_AREA_FLOOD_COLLAPSED`)**: If a botnet on the same `/24` Wi-Fi subnet floods multiple different targets in the same PIN code (>3 reports within 15 minutes), subsequent reports are collapsed so they cannot trigger fake neighborhood heatmap spikes.

### Layer 4: Rival Shop Copy-Pasted Script Filter (`COPY_PASTED_NOTE_COLLAPSED`)
- Computes a normalized fingerprint hash of the incident `note` (lowercased, punctuation stripped).
- If a rival business owner asks 10 friends on different mobile networks to copy-paste the exact same complaint against a competitor, report #1 is recorded (`distinct_reporters = 1`) and all subsequent identical notes are collapsed (`collapse_reason: 'COPY_PASTED_NOTE_COLLAPSED'`).

### Layer 5: Low-Entropy Gibberish & Bot Velocity Defense (`LOW_PAYLOAD_ENTROPY` & `BOT_VELOCITY_10S_EXCEEDED`)
- **Entropy Check (`LOW_PAYLOAD_ENTROPY`)**: Notes with `< 12` non-space characters or `< 5` unique characters (e.g., `"aaaaaaaaaaaa"`, `"123412341234"`, `"scam scam scam"`) are flagged as low-entropy spam (`trust_weight = 0`).
- **10-Second Target Velocity Cap (`BOT_VELOCITY_10S_EXCEEDED`)**: If any target receives $\ge 4$ reports within a 10-second window across any network, burst protection trips and collapses the flood.

---

## 6. Same-ID Rate Limiting: 15-Second Server Gap & 2 Reports/Day Quota

To prevent automated spamming and ensure zero empty shells are ever created in the database:

1. **15-Second Server Cooldown (`SAME_ID_15S_GAP_VIOLATION`)**:
   - After submitting a report, the same identity (`reporter_id`, `user_id`, or IP `/24` subnet) must wait at least **15 seconds** before the server accepts another submission.
   - Any submission within 15 seconds is rejected at the HTTP gateway (`HTTP 429 Too Many Requests`) with the exact remaining seconds to wait.
2. **2 Reports Per Day Per ID Quota (`SAME_ID_2_PER_DAY_QUOTA_EXCEEDED`)**:
   - Each identity is strictly limited to **2 valid reports per rolling 24-hour window**.
   - A 3rd attempt on the same day is rejected at the HTTP gateway (`HTTP 429 Too Many Requests`) before any case or record is created.
3. **Zero Empty Shell Guarantee (`EMPTY_REPORT_SHELL_REJECTED`)**:
   - Every submission must contain a valid canonical identifier, valid channel, valid scam type, valid 6-digit Indian PIN code (`110001`–`855117`), and a meaningful incident description ($\ge 12$ characters, $\ge 3$ words).
   - Invalid or rate-limited requests return `400` or `429` immediately without creating empty `CASE-XXXX` shells or polluting the database.

---

## 7. 8-Vector Fake Report Attack Simulation (50 Reports Stress Test)

We built an isolated sandbox stress-test runner (`runMultiVectorAttackSimulation()` in `src/engine/trustEngine.ts`, accessible via `npm test` or the **Admin Portal** UI) that executes **50 malicious/fake reports across 8 distinct attack vectors**:

| Vector # | Attack Scenario | Fake Reports Sent | Expected Distinct Reporters | Defense Triggered |
| :--- | :--- | :---: | :---: | :--- |
| **Vector 1** | **Same Wi-Fi `/24` Subnet Sybil Burst** (12 accounts on `103.21.58.*`) | 12 | `1` (`SUSPICIOUS`) | `SAME_SUBNET_24H_BURST` (11 blocked) |
| **Vector 2** | **Same Account Multi-Device Hopping** (Same `user_id` across 6 IPs/devices) | 6 | `1` (`SUSPICIOUS`) | `SAME_REPORTER_DUPLICATE` (5 blocked) |
| **Vector 3** | **Rapid-Fire Same-ID Cooldown & Quota Abuse** (6 rapid requests at 0s, 3s, 16s, 20s, 35s, 50s) | 6 | Max `2` accepted | `SAME_ID_15S_GAP_VIOLATION` & `SAME_ID_2_PER_DAY_QUOTA_EXCEEDED` |
| **Vector 4** | **Rival Business Copy-Paste WhatsApp Campaign** (8 different IPs pasting same script) | 8 | `1` (`SUSPICIOUS`) | `COPY_PASTED_NOTE_COLLAPSED` (7 blocked) |
| **Vector 5** | **Keyboard-Mash & Low-Entropy Bot Flood** (`"aaaaaaaaaa..."`, `"12341234..."`) | 5 | `0` (`UNREPORTED`) | `LOW_PAYLOAD_ENTROPY` (5 blocked) |
| **Vector 6** | **Sub-10-Second Distributed Botnet Burst** (8 global IPs hitting 1 number in 3.5s) | 8 | `3` (capped at burst limit) | `BOT_VELOCITY_10S_EXCEEDED` (5 blocked) |
| **Vector 7** | **Coordinated Wi-Fi Area Flood** (5 accounts on 1 Wi-Fi hitting 5 targets in PIN `560066`) | 5 | `3` (flood capped) | `COORDINATED_AREA_FLOOD_COLLAPSED` (2 blocked) |
| **Vector 8** | **Empty-Shell & Malformed Payload Injection** (Blank notes, 1-word notes, bad PINs) | 5 | `0` (`UNREPORTED`) | `EMPTY_REPORT_SHELL_REJECTED` (0 records stored) |

---

## 8. Strict Privacy & Zero-PII Architecture

1. **Anonymous Reporters**: The platform never collects, logs, or stores a reporter's name, phone number, full IP address, or street address. Only the 6-digit postal PIN code (`pincode`) and truncated `/24` IP prefix are stored internally.
2. **Privacy Masking Until Confirmed by $\ge 3$ Distinct Reporters (`src/engine/masker.ts`)**:
   - When `distinct_reporters < 3` (`UNREPORTED` or `SUSPICIOUS`), identifiers are masked in all public responses:
     - **Phone**: `+919876543210` $\rightarrow$ `98XXXXX210`
     - **UPI**: `ramesh.collect@okaxis` $\rightarrow$ `r***@okaxis`
     - **URL**: `https://sbi-kyc-update.in/login` $\rightarrow$ `sbi***.in/...`
     - **Sender ID**: `HDFCBK` $\rightarrow$ `HD****`
   - Only when `distinct_reporters >= 3` (`KNOWN_SCAM`) or `VERIFIED_BUSINESS` is the full identifier shown (`+919876543210`).
3. **Careful Non-Defamatory Wording**:
   - The UI and API strictly use empirical community phrasing: *"Reported by X people near you"* — never *"This person is a fraud/scammer"*.
4. **Sanitized Public Evidence**:
   - `GET /lookup` evidence arrays return **only** `{ occurred_at, channel, scam_type, pincode }`. Internal fields (`reporter_id`, `ip_prefix`, `user_id`, `note`) are stripped from public lookup responses.

---

## 9. Canonical Identifier Normalization Rules

Implemented in `src/engine/normalizer.ts`, all dirty real-world inputs are normalized into a single canonical key before storage or lookup:

- **Indian Phone Numbers**:
  - `+91 98765 43210`, `098765-43210`, `919876543210`, and `9876543210` all normalize to **`+919876543210`**.
  - Rejects invalid starting digits (`0–5` for 10-digit mobiles unless valid landline/toll-free `1800`/`1860`/`1930`).
- **UPI Handles (VPAs)**:
  - `Ramesh.Collect@OKAXIS ` normalizes to **`ramesh.collect@okaxis`**.
- **URLs / Phishing Links**:
  - Strips `http://`, `www.`, query tracking parameters (`?utm_source=...`), fragments (`#...`), and trailing slashes:
  - `http://www.SBI-KYC-Update.in/login/?utm=sms#top` normalizes to **`https://sbi-kyc-update.in/login`**.
- **DLT SMS Headers / Sender IDs**:
  - Strips 2-character telecom operator/circle prefixes (`VM-`, `AD-`, `AX-`, `JX-`, `TM-`, `BP-`, `JD-`):
  - `VM-HDFCBK`, `AD-HDFCBK`, and `ax-hdfcbk` all normalize to **`HDFCBK`**.
- **Junk Input Rejection**:
  - Inputs like `"12345"`, `"test"`, or `"hello"` are immediately rejected with `HTTP 400 Bad Request`.

---

## 10. Cryptographic Server Licence & 4-Step Live Judge Demo

Implemented in `src/engine/licenseEngine.ts`, the platform enforces an **HMAC-SHA256 signed server licence** checked on every API call:

```json
{
  "licensee": "Demo Bank",
  "expires_at": "2026-11-15T10:05:00+05:30",
  "signature": "hmac_sha256_hex_signature"
}
```

### Key Security Properties
- **Tamper Detection**: Modifying `licensee` or `expires_at` by even 1 second invalidates the HMAC-SHA256 signature (`HTTP 400 Invalid cryptographic signature`).
- **Clock-Rollback Protection**: The server tracks `maxObservedTimestampMs`. If the host OS clock is rolled backward to bypass expiry, the licence engine detects the rollback and locks the server (`CLOCK_ROLLBACK_DETECTED`).
- **Graceful Expiry Behavior**: When expired, all API endpoints (except `GET /health` and `GET|POST /license`) return `HTTP 403 {"error": "LICENSE_EXPIRED"}` and the UI displays a lock banner **without deleting any existing reports**.
- **Zero-Restart Live Renewal**: Uploading a valid licence to `POST /license` (or clicking **Step 4: Renew Long Licence** in the **Org License** modal) immediately restores full access with all previous reports intact.

### How to Run the 4-Step Judge Licence Demo in the UI
Click the **Org License (Active)** button in the top navigation bar:
1. **Step 1 (Active Short Licence)**: Load the 5-minute signed licence and submit a test report.
2. **Step 2 (Tamper Test)**: Click *Test Tampered Signature* to see the server reject a modified expiry date with `HTTP 400`.
3. **Step 3 (Simulate Expiry)**: Click *Simulate Expiry Now* — the entire app locks with `HTTP 403 LICENSE_EXPIRED`.
4. **Step 4 (Live Renewal)**: Click *Renew 1-Year Licence* — the app unlocks immediately without restarting the server, and your report from Step 1 is still preserved.

---

## 11. Complete REST API Reference

All core endpoints are mounted both at root (`/reports`, `/lookup`, etc.) and under `/api/*`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check & current licence status (`always 200 OK` even when licence expired) |
| `GET` | `/license` | Inspect active cryptographic licence metadata, remaining time, and signature status |
| `POST` | `/license` | Upload/hot-reload a signed licence JSON payload without restarting the server |
| `POST` | `/reports` | Submit a scam report (enforces normalization, zero-empty-shell, 15s gap, 2/day quota, and 5-layer Trust Engine) |
| `GET` | `/lookup?q=<id>` | Look up any phone, UPI, URL, or SMS sender ID (enforces privacy masking if `< 3` distinct reporters) |
| `GET` | `/heatmap?days=7` | 7-day neighborhood aggregation by 6-digit PIN code, top scam type, and channel |
| `GET` | `/spikes` | Active 24-hour vs 6-day baseline anomaly spikes by PIN code and scam category |
| `GET` | `/api/cases/:caseId` | Look up a specific `CASE-2026-XXXX` status, corroboration progress, and 1930 FIR draft |
| `POST` | `/api/admin/simulate-attacks` | *(Admin)* Run the 8-vector, 50-report fake attack simulation in an isolated sandbox |
| `POST` | `/api/demo/simulate-attack` | Trigger the 40-report live anti-spoofing stress test on a target identifier |
| `POST` | `/api/demo/reset` | Reset the in-memory database back to the clean initial demo seed state |

---

## 12. Automated Verification & Testing Suite (21 Unit Tests + HTTP Script)

### 1. Run the 21 Automated Unit & Anti-Spoofing Tests
```bash
npm test
```
This runs `src/engine/trustEngine.test.ts` using Node's native test runner via `tsx`, verifying:
1. Phone number normalization (`+91`, `0`, dashes, spaces)
2. URL normalization (stripping query params, `www.`, fragments)
3. SMS Header normalization (`VM-HDFCBK` $\rightarrow$ `HDFCBK`)
4. Invalid/junk input rejection (`"12345"`)
5. Privacy masking when `distinct_reporters < 3`
6. Full unmasking when `distinct_reporters >= 3` (`KNOWN_SCAM`)
7. Same `reporter_id` 6x spam collapse (`distinct_reporters = 1`)
8. Same `/24` Wi-Fi subnet 22-account Sybil collapse (`distinct_reporters = 1`)
9. Rival shop copy-pasted complaint script collapse (`distinct_reporters = 1`)
10. Official helpline (`1930`) & bank (`HDFCBK`) allowlist protection under 40-report attack
11. Verified local business (`+91 80 4100 2233` Fresh Bakes) allowlist protection
12. 7-day neighborhood heatmap aggregation by PIN code
13. 24-hour unusual spike detection (`multiplier >= 2.0x`)
14. Cryptographic licence validation, tamper rejection, expiry lock, and live renewal
15. Public evidence sanitization (zero `reporter_id`, `ip_prefix`, or `note` leakage)
16. Same account (`user_id`) switching devices/IPs collapsed as `SAME_REPORTER_DUPLICATE`
17. Low-entropy gibberish notes collapsed as `LOW_PAYLOAD_ENTROPY`
18. Coordinated Wi-Fi area flood across multiple numbers collapsed as `COORDINATED_AREA_FLOOD_COLLAPSED`
19. Sub-10-second botnet burst collapsed as `BOT_VELOCITY_10S_EXCEEDED`
20. Same-ID 15-second cooldown (`SAME_ID_15S_GAP_VIOLATION`) & 2/day quota (`SAME_ID_2_PER_DAY_QUOTA_EXCEEDED`)
21. Full 8-Vector Multi-Attack Simulation (50 fake reports tested in isolated sandbox with 0 empty shells)

### 2. Run the Live HTTP End-to-End Verification Script
While `npm run dev` is running in one terminal, open a second terminal and run:
```bash
npx tsx scripts/test_reports.ts
```

### 3. Run TypeScript Type-Checking
```bash
npm run lint
```

---

## 13. Project Folder Structure

```text
kavachsetu/
├── public/
│   ├── license-5min.json           # Ready-to-upload 5-minute judge demo licence
│   └── license-valid-1year.json    # Ready-to-upload 1-year valid organisation licence
├── scripts/
│   └── test_reports.ts             # Live HTTP end-to-end verification script
├── src/
│   ├── components/
│   │   ├── AdminPortal.tsx         # I4C Cyber Cell Admin Console & 21-test / 8-vector runner
│   │   ├── AuthModal.tsx           # Citizen & Admin sign-in / registration modal
│   │   ├── CaseTrackerTab.tsx      # Case status tracker & 1930 FIR generator
│   │   ├── Header.tsx              # Top navigation, live trust telemetry & license status
│   │   ├── HeatmapTab.tsx          # Interactive 7-day Bengaluru & India PIN heatmap
│   │   ├── LicenseModal.tsx        # 4-step interactive cryptographic license judge demo
│   │   ├── LookupTab.tsx           # Instant identifier lookup, privacy badge & anti-spoof stress test
│   │   ├── ReportModal.tsx         # Anonymous zero-PII scam report form
│   │   └── SpikesTab.tsx           # 24h vs 6-day baseline anomaly spike alerts
│   ├── engine/
│   │   ├── authEngine.ts           # Session & role-based authentication manager
│   │   ├── licenseEngine.ts        # HMAC-SHA256 license verifier & clock-rollback guard
│   │   ├── masker.ts               # Privacy masking for phone, UPI, URL, and SMS sender IDs
│   │   ├── normalizer.ts           # Canonical format normalizer & junk filter
│   │   ├── seedData.ts             # Initial realistic cybercrime seed dataset & allowlist
│   │   ├── trustEngine.ts          # 5-layer anti-spoofing Trust Engine & 8-vector simulator
│   │   └── trustEngine.test.ts     # 21 automated unit & anti-spoofing verification tests
│   ├── types/
│   │   └── scam.ts                 # Shared TypeScript interfaces
│   ├── App.tsx                     # Main application layout & tab router
│   └── main.tsx                    # React DOM entry point
├── server.ts                       # Express API server + Vite middleware on port 3000
├── package.json                    # Dependencies and npm scripts
├── tsconfig.json                   # TypeScript configuration
└── vite.config.ts                  # Vite bundler configuration
```

---

## 14. Troubleshooting Guide

- **Port 3000 is already in use (`EADDRINUSE`)**:
  - Stop any other process running on port 3000, or run on a custom port:
    - macOS/Linux: `PORT=3001 npm run dev`
    - Windows PowerShell: `$env:PORT=3001; npm run dev`
- **`npm install` fails or `tsx: command not found`**:
  - Ensure you are using **Node.js v18 or v20+** (`node -v`). Delete `node_modules` and `package-lock.json`, then run `npm install` again.
- **API returns `403 LICENSE_EXPIRED` during testing**:
  - You clicked *Simulate Expiry* during the licence demo. Click the **Org License** button in the top bar and click **Step 4: Renew 1-Year Licence** (or restart `npm run dev`).
- **Report submission returns `429 Too Many Requests`**:
  - The **15-second cooldown** or **2 reports/day per ID** anti-spam protection is active. Wait 15 seconds between reports, or open the **Admin Portal** and click **Reset Demo Data** to clear rate-limit counters.
