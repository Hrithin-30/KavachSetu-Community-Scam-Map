# Launch Flow & Admin Portal Heading Update

Always start the application on the **Citizen Sign-In** screen (with the **Continue as Guest** option) on initial load, and replace the confusing **"I4C Nodal Authority Gate"** heading with **"KavachSetu Admin Portal"** across the Admin login screen and dashboard.

## User Review & Critical Decisions

> [!IMPORTANT]
> Confirmed user preferences from our clarification step:

- **Confirmed Decision 1 (Initial Launch Screen)**: The app will always launch on the **Citizen Sign-In screen first** (with the **Continue as Guest** option), ignoring and clearing any `#admin` URL hash left over from a previous session. The Admin Portal will only open when the user explicitly clicks **Officer / Admin Login**.
- **Confirmed Decision 2 (Admin Heading)**: Replace **"I4C Nodal Authority Gate"** (which visually resembled "14C") with **"KavachSetu Admin Portal"** across the Admin login gate and Admin dashboard header.

---

## 1. Overview & Core Concept

- **What It Does**: Guarantees a predictable startup flow where citizens and evaluators always land on the Citizen Sign-In / Guest entry screen first, and provides clear, unambiguous branding on the **KavachSetu Admin Portal**.
- **Target Audience / Persona**: Citizens reporting or checking scams, guests exploring the map, and administrators/evaluators testing the Admin console.
- **Key Value**: Eliminates accidental startup into the Admin login screen on page refresh and removes confusing "I4C / 14C" acronym jargon from the Admin interface.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **App Launch / Refresh**: Always opens the **Citizen Account Log In** screen first (where users can sign in with a pre-filled demo citizen account, create an account, or click **Continue as Guest**). Any stale `#admin` URL hash is automatically cleared on startup.
  2. **Switching to Admin**: Clicking **Officer / Admin Login** in the top-right bar transitions to the **KavachSetu Admin Portal** login screen.
  3. **Returning to Citizen Portal**: Clicking **Citizen Portal** from the Admin screen cleanly returns to the Citizen view without snapping back to Admin.
- **Visual Identity & Theme**:
  - Retains the dark cybersecurity aesthetic (`#070B14` background, indigo/emerald trust badges) with clean, readable headings:
    - Main Title: **KavachSetu Admin Portal**
    - Subtitle: **Administrator Login & Security Control Panel**

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Explicit State Routing Instead of URL Hash Auto-Boot**
  - *Chosen Approach*: Initialize `siteMode` strictly to `'user'` on application mount and clear any `#admin` hash on load.
  - *Why*: In iframe preview environments, a leftover `#admin` hash in the URL caused the app to boot directly into the Admin login screen and prevented returning to the Citizen Portal reliably.
- **Decision 2: Clear "KavachSetu Admin Portal" Branding**
  - *Chosen Approach*: Replace "I4C Nodal Authority Gate", "Authorize Nodal Session", and "Nodal Officer ID" with "KavachSetu Admin Portal", "Sign In to Admin Portal", and "Admin Email / ID".
  - *Why*: "I4C" in sans-serif typography looks like "14C" and is unclear to general users.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

```text
┌───────────────────────────────────────────────────────────────────┐
│                    App Launch (Initial Mount)                     │
│  • siteMode initialized to 'user'                                 │
│  • Clears any stale '#admin' hash from window.location            │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│            Citizen Sign-In Screen (First Screen Always)           │
│  • Log in as Citizen (Rahul / Neha)                               │
│  • Continue as Guest ───────────────► Public Scam Lookup & Map    │
│  • Click "Officer / Admin Login" ───┐                             │
└─────────────────────────────────────┼─────────────────────────────┘
                                      │
                                      ▼
┌───────────────────────────────────────────────────────────────────┐
│                     KavachSetu Admin Portal                       │
│  • Heading: "KavachSetu Admin Portal"                             │
│  • Button: "Sign In to Admin Portal"                              │
│  • Click "Citizen Portal" ──────────► Returns to Citizen View     │
└───────────────────────────────────────────────────────────────────┘
```

- **Interactive Component & State Mapping**:
  - **Root Application State**: Starts with `siteMode = 'user'` and `showCitizenGate = true`. Strips `#admin` from `window.location` on initial mount so browser refreshes always start on the Citizen Sign-In gate.
  - **Admin Login & Dashboard Header**: Updates the login card title, subtitle, input labels, submit button, and dashboard top bar to **KavachSetu Admin Portal**.
