const { existsSync } = require("node:fs");
const { delimiter, join } = require("node:path");
const { spawnSync } = require("node:child_process");

const env = { ...process.env };

if (process.platform === "win32") {
  const androidStudioJdk =
    env.ANDROID_STUDIO_JDK ||
    "C:\\Program Files\\Android\\Android Studio\\jbr";

  if (existsSync(join(androidStudioJdk, "bin", "java.exe"))) {
    env.JAVA_HOME = androidStudioJdk;
  }

  const androidHome =
    env.ANDROID_HOME ||
    (env.LOCALAPPDATA ? join(env.LOCALAPPDATA, "Android", "Sdk") : "");

  if (androidHome && existsSync(androidHome)) {
    env.ANDROID_HOME = androidHome;
    env.Path = [
      join(androidHome, "platform-tools"),
      join(androidHome, "emulator"),
      env.Path || "",
    ].join(delimiter);
  }
}

const expoCli = require.resolve("expo/bin/cli");
const result = spawnSync(
  process.execPath,
  [expoCli, "run:android", ...process.argv.slice(2)],
  {
    env,
    stdio: "inherit",
  }
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
