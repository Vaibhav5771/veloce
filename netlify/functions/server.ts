import path from "node:path";
import { createRequestHandler } from "expo-server/adapter/netlify";

// Serves the Expo Router API routes (app/(api)/**/+api.ts) exported into dist/server.
export default createRequestHandler({
  build: path.join(__dirname, "../../dist/server"),
});
