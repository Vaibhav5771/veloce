# Veloce

Ride-booking app built with Expo / React Native.

## Stack
- Expo + expo-router, NativeWind (Tailwind CSS) for styling
- Clerk for authentication
- Neon serverless Postgres (`@neondatabase/serverless`) for the database
- Google Maps Platform (`react-native-maps`, `react-native-maps-directions`, Google Places Autocomplete) for maps/location
- Zustand for state management
- Razorpay for payments (migrating off Stripe — legacy Stripe routes still live in `app/(api)/(stripe)/`)

## Skills to use when developing

Always check for and use the relevant installed skill before writing code in these areas — they carry vendor-maintained, up-to-date guidance instead of relying on training-data memory:

- `vercel-react-native-skills` — React Native / Expo performance, list rendering, animations, native modules
- `expo-tailwind-setup` — NativeWind + Tailwind CSS setup/usage in Expo
- `expo-native-ui` — native-feeling UI, HIG styling, gradients, visual effects, animations
- `expo-dev-client` — dev client builds and distribution
- `clerk` — auth flows, Expo patterns, sessions, webhooks
- `neon-postgres` — connections, pooling, branching for `@neondatabase/serverless`
- `google-maps-platform` — maps, places, routing/ETA APIs
- `stripe-best-practices` — payments/keys/webhooks (relevant while legacy Stripe routes remain)

No official skill exists yet for Razorpay or Zustand — use general best judgment there.

## Knowledge graph

`graphify-out/` (gitignored) holds a generated knowledge graph of this codebase. Run `/graphify` to rebuild it, or `/graphify query "<question>"` to query the existing graph instead of re-exploring the codebase from scratch.
