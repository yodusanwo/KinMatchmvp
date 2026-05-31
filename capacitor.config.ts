import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.kinmatch.mvp",
  appName: "KinMatch",
  webDir: "native-shell",
  server: {
    url: "https://kin-matchmvp.vercel.app",
    cleartext: false,
    androidScheme: "https",
  },
  ios: {
    contentInset: "automatic",
  },
  plugins: {
    App: {
      appUrlOpen: {
        enabled: true,
      },
    },
  },
};

export default config;
