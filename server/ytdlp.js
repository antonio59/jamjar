import YtDlpModule from "yt-dlp-wrap";
import fs from "fs";

// Node.js ESM/CJS interop: yt-dlp-wrap ships CJS with exports.default = YTDlpWrap
// so the default import is the module namespace object, not the class directly
const YtDlp = YtDlpModule.default ?? YtDlpModule;

export const YTDLP_BIN = process.env.YTDLP_PATH || "/usr/local/bin/yt-dlp";

export function createYtDlp() {
  return new YtDlp(YTDLP_BIN);
}

// Args every yt-dlp invocation needs: PO-token generation through the same Node
// binary running the server, plus cookies when configured.
export function baseArgs() {
  const args = ["--js-runtimes", `node:${process.execPath}`];
  const cookiesFile = process.env.YTDLP_COOKIES_FILE;
  if (cookiesFile && fs.existsSync(cookiesFile)) {
    args.push("--cookies", cookiesFile);
  }
  return args;
}
