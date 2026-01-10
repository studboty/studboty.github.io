import { registerSW } from "/active/prxy/register-sw.mjs";
import * as BareMux from "/active/prxy/baremux/index.mjs";
import { getFavicon, rAlert } from "./utils.mjs";

const connection = new BareMux.BareMuxConnection("/active/prxy/baremux/worker.js");

export function search(input, template) {
  try {
    return new URL(input).toString();
  } catch (err) { }

  try {
    const url = new URL(`http://${input}`);
    if (url.hostname.includes(".")) return url.toString();
  } catch (err) { }

  return template.replace("%s", encodeURIComponent(input));
}

export async function getUV(input) {
  try {
    await registerSW();
    rAlert("SW ✓");
  } catch (err) {
    rAlert(`SW failed to register.<br>${err.toString()}`);
    throw err;
  }

  let url = search(input, "https://html.duckduckgo.com/html?t=h_&q=%s");

  /* 
    Wisp Server Rotation Logic:
    We try servers in order. Ideally, we'd verify them with a ping, but for now we set the transport 
    and if it fails (throws), we try the next.
  */
  const wispServers = [
    "wss://wisp.lupinevault.com/", // Less usage, cleaner IP?
    "wss://wisp.mercurywork.shop/",
    "wss://wisp.rhw.one/",
    "wss://epoxy.advik.workers.dev/"
  ];

  let connected = false;

  for (const server of wispServers) {
    try {
      console.log(`[Proxy] Attempting connection to Wisp: ${server}`);
      // BareMux connection setup
      if ((await connection.getTransport()) !== "/active/prxy/epoxy/index.mjs" || currentWisp !== server) {
        await connection.setTransport("/active/prxy/epoxy/index.mjs", [{ wisp: server }]);
        currentWisp = server; // Track which one is active
      }
      console.log(`[Proxy] Connected to ${server}`);
      connected = true;
      break; // Success!
    } catch (e) {
      console.warn(`[Proxy] Failed to connect to ${server}:`, e);
      // Continue to next server
    }
  }

  if (!connected) {
    rAlert("Failed to connect to any Wisp server. Check your internet or try again later.");
    throw new Error("All Wisp servers failed.");
  }

  // Fallback check for libcurl is removed as it causes issues with bloxd.io (needs WS)

  let viewUrl = __uv$config.prefix + __uv$config.encodeUrl(url);

  return viewUrl;
}

// Global to track current connection so we don't reconnect needlessly
let currentWisp = null;
