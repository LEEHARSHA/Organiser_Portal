# Fitness Species Community

Community Organizer Website MVP built with Next.js App Router, TypeScript, Firebase Authentication, and the existing Fitness Species Express API. The browser never connects directly to MongoDB. Public event data, organizer applications, drafts, moderation, and participant registrations use the shared backend at `/api/community`.

## Local development

Requirements: Node.js 22.18+ and npm.

```powershell
Set-Location D:\Organiser_Portal
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The public homepage and event directory render without a Firebase session. Authenticated organizer features require the Firebase Web App configuration and a reachable backend.

## Environment variables

Configure these in `.env.local` for development and in the Vercel project’s Production, Preview, or Development environment as appropriate:

```env
NEXT_PUBLIC_API_BASE_URL=https://fitness-species-backend.onrender.com
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_web_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sellerportal-2786c.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=sellerportal-2786c
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_web_app_id
```

Firebase values are public Web App configuration, not service-account credentials. This app requires Firebase project `sellerportal-2786c`. Do not add Firebase Admin JSON, MongoDB credentials, admin UIDs, or payment secrets to frontend environment variables. The website does not use Firebase Storage.

In Firebase Console, enable the existing Email/Password sign-in provider and add `localhost` plus the deployed Organizer Portal hostname under Authentication → Settings → Authorized domains. New accounts can be created through Firebase email/password; organizer approval remains a server-side workflow.

## Backend and moderation

The Community API is implemented in the existing [FitnessSpeciesBackend](../FitnessSpeciesBackend). It stores canonical event data in MongoDB collections `communityOrganizers`, `communityEvents`, and `communityRegistrations`; moderation decisions are retained in `communityModerationLogs`. Startup ensures unique Firebase UID and event/participant registration indexes, event status/date indexes, moderation-history indexes, and a `2dsphere` event location index. GeoJSON coordinates use `[longitude, latitude]`.

The API verifies Firebase ID tokens and uses their UID for ownership and participant identity. Pending organizers cannot create events. Only approved organizers can create drafts or submit them. Draft, rejected, and changes-requested events stay private; edits to an approved event return it to review. Public discovery and details return approved events only, and nearby queries apply server-side geospatial radius filters. Event registration uses an atomic capacity reservation and unique event/participant index.

The existing [Admin Portal](../Admin_Website/fitness-species-admin) now has a Community Review page at `/community`. Admin endpoints require the reviewer UID in the backend’s `ADMIN_FIREBASE_UIDS`; the frontend does not confer admin rights. If applying the backend changes to a deployed service, deploy the API first so the website’s community routes are available.

Sensitive application and event write routes have per-process rate limits. If the Render service is later horizontally scaled, add a shared rate-limit store or enforce the same limits at a trusted edge; an in-memory limit is not shared across service instances.

## Vercel deployment

The production portal is live at <https://fitness-species-community.vercel.app>. Its Vercel project is `fitness-species-community` under `leeharshas-projects`; it was deployed directly from this directory using the Vercel CLI. The project is not connected to a Git repository, so future updates must be deployed with `npx vercel deploy --prod` or connected to a repository in Vercel.

The production environment contains the five variables above. The backend CORS allowlist includes the exact production origin, and `fitness-species-community.vercel.app` is an authorized Firebase domain. Email/Password sign-in is enabled for Firebase project `sellerportal-2786c`.

The production homepage, login page, public event discovery, backend health, and CORS preflight have been checked. Public event discovery currently has no published events. Account creation, sign-in, organizer application submission, and admin moderation were not exercised with production accounts.

## Quality checks

```powershell
npm test
npx tsc --noEmit
npm run lint
npm run build
npm audit
```

`npm test` validates external event image URL handling. The backend’s fixture tests cover organizer approval, event visibility and ownership, pricing validation, server-side geo filtering/distance sorting, registrations, capacity, cancellation, and request limits. These tests do not use production Firebase or MongoDB credentials.

## Scope and launch notes

- Implemented routes: `/`, `/events`, `/events/[id]`, `/login`, `/organizer/apply`, `/dashboard`, `/dashboard/events`, `/dashboard/events/new`, `/dashboard/events/[id]/edit`, `/dashboard/registrations`, and `/dashboard/settings`.
- Paid listings show price and external instructions only. The platform does not collect or confirm payments.
- Event cover images are user-provided HTTPS URLs. The browser displays a fallback on load failure; the backend does not fetch arbitrary URLs.
- Admin moderation UI and backend routes are present, but deployment still requires backend release and an owner-configured admin UID.
- Privacy, terms, and contact pages are preliminary. Fitness Species must supply and review final legal text and an official support contact before public launch.
- Email notifications, CSV export, Firebase Storage uploads, in-platform payments, and production end-to-end testing are not part of this MVP.
