import { mergeConfig, type UserConfigExport, type ConfigEnv } from "vite";
import base from "./vite.config";
export default async (env: ConfigEnv) => {
  const b = typeof base === "function" ? await (base as any)(env) : await base;
  return mergeConfig(b, { resolve: { dedupe: ["react-native-safe-area-context", "react-native-reanimated", "react-native-svg", "react-native-web", "react-native-gesture-handler", "expo-linear-gradient"] } });
};
