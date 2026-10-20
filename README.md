# Veloce

A ride-booking app for Android and iOS. Search a destination, pick a ride, pay for it, and watch
it arrive — with real authentication, a real payment gateway and a real database behind it.

**Expo SDK 54** · React Native 0.81 · React 19 · expo-router · NativeWind · Zustand · Clerk ·
Neon serverless Postgres · Razorpay · Google Maps Platform

<!--
  Screenshots: drop them in here as a row once captured.
  | Home | Choose a ride | Payment | Tracking |
  |---|---|---|---|
  | ![](docs/screens/home.png) | ![](docs/screens/choose.png) | … |
-->

---

## What it does

Sign in with email or Google, search a destination with Places Autocomplete, see the route drawn
on a live map, choose from available rides with fare and pickup time, pay through the native
Razorpay sheet, then track the car in. Every ride is saved and shows up in your history, where
you can delete it.

## Scope

The rider side is complete and real end to end:

- **Auth** — Clerk email/password with verification codes, plus Google OAuth, sessions in secure
  storage
- **Maps** — device GPS, reverse geocoding, Google Places Autocomplete, a real Directions route
- **Payments** — a genuine Razorpay order, created server-side, with the signature verified
  server-side before any ride is written
- **Persistence** — rides and users in Neon serverless Postgres, through Expo API routes

The dispatch side is stubbed by design — there is no driver app, so drivers, ETA and tracking are
simulated against the real route. [project.md](project.md) documents exactly where that boundary
sits and why.

## Architecture in one line

Expo Router serves both the app and its backend: screens under `app/(root)`, server routes under
`app/(api)`, talking to Neon over the serverless HTTP driver and to Razorpay and Google Maps over
HTTPS. One codebase, one dev server.

## Running it

```bash
npm install
npx expo start     # or: npm run android / npm run ios
```

Android needs a development build (`expo-dev-client`) rather than Expo Go, since Razorpay and
react-native-maps are native modules. Six environment variables are required — they're listed with
what reads each one in [project.md](project.md#running-locally).

## Read more

- **[project.md](project.md)** — the engineering write-up: architecture, data model, the payment
  trust boundary, the design of the tracking simulation, stack rationale, and known gaps
- **[case-study/veloce-rider-personas.pdf](case-study/veloce-rider-personas.pdf)** — the six rider
  personas the flow was designed around
