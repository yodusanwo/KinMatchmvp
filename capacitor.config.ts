import type { CapacitorConfig } from "@capacitor/cli";

const productionUrl =
  process.env.CAPACITOR_SERVER_URL ?? "https://kin-matchmvp.vercel.app";

const config: CapacitorConfig = {
  appId: "app.kinmatch.mvp",
  appName: "KinMatch",
  webDir: "native-shell",
  server: {
    url: productionUrl,
    cleartext: false,
    androidScheme: "https",
  },
  ios: {
    contentInset: "automatic",
  },
};

export default config;
