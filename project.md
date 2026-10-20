# Veloce

A ride-booking mobile app built with Expo / React Native — onboarding and auth, a live map with
Places search, driver selection, a real Razorpay payment, and a ride-tracking screen, backed by
serverless Postgres.

The interaction patterns are Uber's; the implementation is from scratch. What's here is a complete
vertical slice of the rider experience: real authentication, real geolocation and routing, money
actually moving through Razorpay's test gateway, and rides persisting to a hosted database.

| | |
|---|---|
| **Platform** | Android (primary), iOS, web (SSR, to host the API routes) |
| **Runtime** | Expo SDK 54 · React Native 0.81 · React 19 |
| **Backend** | Expo Router server routes · Neon serverless Postgres |
| **Auth / Payments** | Clerk · Razorpay |
| **Build target** | Android APK via EAS (`debug` / `profile` / `release`) |

---

## Scope

The rider side is complete and real end to end:

- **Authentication** — Clerk email/password with verification codes, plus Google OAuth. Sessions
  persist in `expo-secure-store`; signed-up users are mirrored into Postgres.
- **Location and maps** — real device GPS (`expo-location`), reverse geocoding, Google Places
  Autocomplete and Place Details for origin/destination, and a real Directions route polyline drawn
  on the map.
- **Payments** — a genuine Razorpay order is created server-side, the native checkout sheet opens,
  and the returned signature is verified server-side before anything is written.
- **Persistence** — rides and users are stored in Neon serverless Postgres through Expo API routes.
  History, per-user lookup and deletion all hit the real database.

The dispatch side is stubbed by design. There is no driver app and none is planned, so:

- **Drivers** are four fixed records in [components/Map.tsx](components/Map.tsx), positioned by
  jittering the rider's own coordinates in `generateMarkersFromData()` ([lib/map.ts](lib/map.ts)).
- **ETA and fare** are assigned deterministically at enrich time (`5 + 4i` minutes, `₹12 + 3i`)
  rather than derived from the route.
- **Ride tracking** has no live driver GPS to consume, so the ETA counts down while the driver
  marker advances along the *real* route polyline.

The mock boundary sits exactly where a dispatch backend would attach: everything above it —
routing, pricing display, payment, persistence — is production-shaped.

---

## Where the design came from

Before any code, six rider personas were researched and written up:
[case-study/veloce-rider-personas.pdf](case-study/veloce-rider-personas.pdf) (source:
[veloce-rider-personas.html](case-study/veloce-rider-personas.html)).

That work is why the home screen opens with a single destination field rather than a form, why
fare and pickup time are shown together before payment rather than after, and why ride history is
one tab away instead of buried in a profile menu. The flow follows the personas, not a screenshot
of a competitor.

---

## User journey

1. **Onboarding** — a three-slide swiper (copy in [constants/index.ts](constants/index.ts)) on
   first launch.
2. **Sign up / sign in** — Clerk email and verification code, or Google OAuth via
   [components/OAuth.tsx](components/OAuth.tsx) and [lib/auth.ts](lib/auth.ts). New users are
   `POST`ed to `/(api)/user`, which upserts on email conflict.
3. **Home** ([home.tsx](app/(root)/(tabs)/home.tsx)) — requests location permission (falling back
   to San Francisco if denied), reverse-geocodes the address, renders the map and the five most
   recent rides. Searching a destination routes into the ride flow.
4. **Find ride** ([find-ride.tsx](app/(root)/find-ride.tsx)) — confirm or edit From/To through
   Places Autocomplete. Both addresses land in the Zustand location store.
5. **Choose a ride** ([confirm-ride.tsx](app/(root)/confirm-ride.tsx)) — pick a driver; the
   selection is held in the driver store.
6. **Book ride** ([book-ride.tsx](app/(root)/book-ride.tsx)) — fare, pickup time and seat summary,
   with the payment button pinned as the sheet footer.
7. **Pay** ([components/Payment.tsx](components/Payment.tsx)) — order, checkout, verify, persist.
   Success and failure both surface through a themed `AlertModal`.
8. **Track** ([track-ride.tsx](app/(root)/track-ride.tsx)) — ETA countdown, driver card, trip
   addresses, animated driver marker.
9. **History** ([rides.tsx](app/(root)/(tabs)/rides.tsx)) — full ride list with delete, scoped
   server-side to the requesting user's own rides. Home refetches on focus, so the two tabs never
   disagree after a deletion.

The **Chat** tab is an intentional empty state — scaffolded, not implemented.

---

## Architecture

```
┌─────────────────────────── Expo app (React Native) ───────────────────────────┐
│  app/(auth)      welcome · sign-in · sign-up · sso-callback                   │
│  app/(root)      (tabs): home · rides · chat · profile                        │
│                  find-ride → confirm-ride → book-ride → track-ride            │
│  store/          Zustand: useLocationStore · useDriverStore                   │
│  components/     Map · GoogleTextInput · RideLayout · Payment · …             │
└───────────────┬──────────────────────────────┬────────────────────────────────┘
                │ fetch("/(api)/…")            │ direct HTTPS
                ▼                              ▼
┌─────────────────────────────┐   ┌────────────────────────────────────────────┐
│ Expo API routes (+api.ts)   │   │ Google Maps Platform                       │
│  /(api)/user                │   │  Places Autocomplete · Place Details       │
│  /(api)/ride/create         │   │  Directions (route polyline)               │
│  /(api)/ride/[email]        │   │ Geoapify                                   │
│  /(api)/ride/delete         │   │  static map thumbnails for ride history    │
│  /(api)/razorpay/create     │   └────────────────────────────────────────────┘
│  /(api)/razorpay/verify     │
└──────────┬──────────────────┘
           ▼
   Neon serverless Postgres  (users · drivers · rides)
```

The API routes are Expo Router server routes, so the app and its backend share one codebase and
one dev server. Nothing needs to be started separately in development.

### State

Two small Zustand stores in [store/index.ts](store/index.ts) carry everything across the ride flow:
`useLocationStore` (user and destination lat/lng/address) and `useDriverStore` (driver list and
selection). Server data is deliberately not mirrored into global state — ride history is fetched
per screen through the `useFetch` hook in [lib/fetch.ts](lib/fetch.ts), which exposes `refetch` for
focus-triggered revalidation.

### Data model

Three tables in Neon. The schema is **not** versioned in this repo — it was applied directly to the
Neon branch, which is a known gap.

- **`users`** — `name`, `email` (unique; the upsert conflict target), `clerk_id`.
- **`drivers`** — `id`, `first_name`, `last_name`, `car_seats`, profile and car image URLs,
  `rating`. Row ids match the fixed driver ids in `Map.tsx`, which is what lets ride history join
  to a real driver record.
- **`rides`** — origin and destination addresses and coordinates, `ride_time`, `fare_price`,
  `payment_status`, `driver_id` (joined to `drivers`), `user_email`, `created_at`.

Rides are keyed to the rider by `user_email` rather than a hard foreign key to `users`, because the
email is what Clerk hands the client directly. Deletes are scoped by `id AND user_email`
server-side, so a ride id alone cannot remove someone else's history.

---

## Problems worth describing

### Keeping a payment honest

A client cannot be trusted to report its own success. If the app simply told the server "the
payment worked, save the ride", anyone with the endpoint could book free rides.

So the trust boundary sits on the server, and [Payment.tsx](components/Payment.tsx) runs four
sequential steps, refusing to advance past any failure:

1. `POST /(api)/razorpay/create` — the server creates the order and converts rupees to paise.
   `RAZORPAY_SECRET_KEY` never reaches the device.
2. `RazorpayCheckout.open()` — the native checkout sheet.
3. `POST /(api)/razorpay/verify` — the server recomputes
   `HMAC_SHA256(order_id|payment_id, secret)` and compares it to the signature Razorpay returned.
4. `POST /(api)/ride/create` — only now is the ride written, with `payment_status: "paid"`.

**A ride is never saved on an unverified payment.** The signature check is the whole point of the
third step; without it the second step is just a UI that can be faked.

The error path needed its own handling. Razorpay's SDK rejects with `{ code, description }`, where
`description` is sometimes a JSON-wrapped error body and sometimes a plain cancellation string —
so a user who simply tapped back was being shown a raw JSON blob. `parseRazorpayError()` unwraps
both shapes, and a cancellation now reads as "Payment cancelled".

### Making a simulation cohere

With no driver GPS to consume, tracking had to be simulated — but a countdown and a moving marker
that disagree look broken in a way that undermines everything around them. If the timer says
"arriving in 2 min" while the car is still halfway across the map, the screen reads as a bug rather
than a stub.

Both are therefore driven by one constant: **8 real seconds = 1 simulated minute**, declared in
[track-ride.tsx](app/(root)/track-ride.tsx) as `ETA_TICK_MS` and in [Map.tsx](components/Map.tsx)
as `MOCK_MS_PER_SIMULATED_MINUTE`. The marker interpolates along the real Directions polyline at
that rate while the countdown decrements at the same one, so the two stay in agreement for the
whole trip. The route under the car is genuine; only its progress along it is synthetic.

### Failing loudly on bad config

Mounting `ClerkProvider` with an empty publishable key does not error. It hangs — forever — on a
loading spinner, with nothing in the logs pointing at the cause. I lost real time to this twice:
once to a stale Metro cache that had inlined an empty value, once to a dead emulator network.

[app/_layout.tsx](app/_layout.tsx) now reads the key from `process.env` (Metro inlines
`EXPO_PUBLIC_*` at build time) with a fallback to `Constants.expoConfig.extra`, and if it is still
empty it renders an explicit error screen naming both the variable and the command that fixes it,
rather than mounting the provider. The loading gate also escalates after 10 seconds — "Connecting…"
becomes "Still connecting…" with a network hint — so the two failure modes are distinguishable
from the outside.

---

## Stack and why

| Choice | Reasoning |
|---|---|
| **Expo + expo-router** | File-based routing, typed routes, and API routes in one tree. The `(auth)` / `(root)` route groups keep the signed-out and signed-in trees structurally separate. |
| **Clerk** | Hosted auth with a first-class Expo SDK — email codes, Google OAuth and secure session storage without hand-rolling token refresh. |
| **Neon serverless Postgres** | The HTTP driver (`@neondatabase/serverless`) works inside serverless functions with no connection pool to manage, and scale-to-zero suits a demo app's traffic shape. |
| **Razorpay** | The app is priced in ₹ and targets Indian rails; test mode allows a genuine end-to-end payment. Migrated off Stripe. |
| **Zustand** | Three screens must agree on origin, destination and driver. A store this small doesn't justify Redux, and prop-drilling across a four-screen flow is worse. |
| **NativeWind** | Tailwind classes in RN, with the theme in [tailwind.config.js](tailwind.config.js) and custom font families registered as utilities. |
| **react-native-maps** | Native map view with a custom "Aubergine" night style matching the app's identity, plus `react-native-maps-directions` for the route. |

**Design language:** near-black surfaces, `#00FF1A` as the single accent, Plus Jakarta Sans for UI
text, and Orbitron for the Veloce wordmark (rendered through a gradient mask in
[GradientText.tsx](components/GradientText.tsx)).

### Other implementation notes

- **Ride-history thumbnails are static images, not maps.** [RideCard.tsx](components/RideCard.tsx)
  renders a Geoapify static map PNG per row instead of mounting a native `MapView`. A list of live
  map views is expensive to scroll; an image is not.
- **Places Autocomplete is hand-rolled.** [GoogleTextInput.tsx](components/GoogleTextInput.tsx)
  calls the Places Autocomplete and Place Details REST endpoints directly rather than using
  `react-native-google-places-autocomplete`, which gives back control of the dropdown's styling
  and keyboard behaviour inside a bottom sheet.
- **Shared ride-flow chrome.** [RideLayout.tsx](components/RideLayout.tsx) wraps the map, a
  `@gorhom/bottom-sheet` with per-screen snap points, and a pinned footer, so the four ride screens
  differ only in their content.
- **Tab screens stay mounted**, so Home and Rides would otherwise disagree after a deletion. Both
  refetch on focus.
- **Web has a stub map.** [Map.web.tsx](components/Map.web.tsx) stands in for the native map so the
  web export — which exists to host the API routes — still builds.

---

## Project structure

```
app/
  _layout.tsx             fonts, splash, Clerk provider, auth gate
  (auth)/                 welcome, sign-in, sign-up, SSO callback
  (root)/
    (tabs)/               home, rides, chat, profile
    find-ride.tsx         origin/destination entry
    confirm-ride.tsx      driver selection
    book-ride.tsx         fare summary + pay
    track-ride.tsx        tracking
  (api)/                  server routes (user, ride/*, razorpay/*)
components/               Map, GoogleTextInput, Payment, RideLayout, cards, inputs
lib/                      auth (token cache, OAuth), fetch (useFetch), map, utils
store/                    Zustand stores
constants/                icons, images, onboarding copy
plugins/withAbiSplits.js  Android ABI splits for a smaller APK
netlify/functions/        Netlify adapter for the exported Expo server
case-study/               rider personas (HTML + PDF)
```

---

## Running locally

```bash
npm install
npx expo start          # or: npm run android / npm run ios / npm run web
```

Android needs a development build (`expo-dev-client`), not Expo Go — `react-native-razorpay` and
`react-native-maps` are native modules.

Create a `.env` with the six variables the code actually reads:

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=    # auth
EXPO_PUBLIC_GOOGLE_API_KEY=           # Places Autocomplete, Place Details, Directions
EXPO_PUBLIC_GEOAPIFY_API_KEY=         # static map thumbnails in ride history
EXPO_PUBLIC_RAZORPAY_PUBLISHABLE_KEY= # checkout (client) + order creation (server)
RAZORPAY_SECRET_KEY=                  # server only — never shipped to the device
DATABASE_URL=                         # Neon connection string
```

`.env` is gitignored. After changing it, restart with `npx expo start -c` — Metro inlines
`EXPO_PUBLIC_*` values at build time, and a stale cache will silently serve the old ones.

> **If auth hangs on "Still connecting…"** after the emulator has sat idle for hours, it is almost
> always the emulator's network having died rather than your credentials — toggle airplane mode on
> the emulator. The other cause is an empty Clerk key from a stale Metro cache, which the app now
> catches and reports explicitly.

## Deployment

Netlify hosting for the API routes is configured but is **not** the active origin. [netlify.toml](netlify.toml)
runs `npx expo export -p web`, publishes `dist/client`, and routes unmatched requests to
[netlify/functions/server.ts](netlify/functions/server.ts), which serves the exported Expo server
bundle from `dist/server`.

The app itself still calls the local dev server: the `origin` option on the `expo-router` plugin in
[app.config.js](app.config.js) is set to `http://10.0.2.2:8081/`, the Android emulator's loopback
to the Metro host. Pointing release builds at the deployed origin requires changing that value —
and authenticating the API routes first (see below).

Android builds go through EAS ([eas.json](eas.json)): `debug` and `profile` produce
internal-distribution APKs with the dev client attached; `release` is the store profile. The
`withAbiSplits` config plugin splits by ABI to keep the APK size down.

---

## Known gaps

In priority order.

1. **The API routes are unauthenticated.** No route in [app/(api)/](app/(api)/) verifies a Clerk
   session; `user_email` is trusted straight from the request body. This is harmless while the
   origin is a local dev server, and it is the blocking prerequisite for any public deployment —
   otherwise the endpoints are an open write path to the database.
2. **The database schema is not in the repo.** The three tables exist only in Neon, so a fresh
   clone cannot stand the backend up. Migrations belong here.
3. **ETAs and fares are not real.** `calculateDriverTimes()` in [lib/map.ts](lib/map.ts) already
   computes both from the Directions API, but nothing calls it — and it reads
   `EXPO_PUBLIC_DIRECTIONS_API_KEY`, which is not in `.env`, so it would need repointing at
   `EXPO_PUBLIC_GOOGLE_API_KEY` before it could run.
4. **The Chat tab is an empty state.** Implement it or remove the tab.
5. **There are no tests.** The payment path and the ride-flow state transitions are the
   highest-value places to start.
6. **`npm run lint` cannot complete locally.** The flat config loads, but
   `eslint-import-resolver-typescript` fails to load its native binding — a known npm
   optional-dependency bug that needs a clean `node_modules` reinstall. `npx tsc --noEmit` is
   clean.
