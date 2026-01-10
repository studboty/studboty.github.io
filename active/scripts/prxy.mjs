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

  const wispServers = [
    "wss://wisp.lupinevault.com/", // Project Owner's - Often more reliable
    "wss://wisp.rhw.one/", // Backup
    "wss://wisp.mercurywork.shop/", // Was throttling
    "wss://epoxy.advik.workers.dev/" // Additional backup if available
  ];

  // Stick to the primary server for stability. Random selection was hitting dead servers.
  // Changed to rhw.one as lupinevault was being throttled/refusing connection.
  const selectedWisp = "wss://wisp.rhw.one/";
  console.log("[Proxy] Using Primary Wisp Server:", selectedWisp);

  if ((await connection.getTransport()) !== "/active/prxy/epoxy/index.mjs") {
    await connection.setTransport("/active/prxy/epoxy/index.mjs", [
      { wisp: selectedWisp },
    ]);
  }
  // Try libcurl as secondary transport if needed, though usually one is active. 
  // The original code checked both.
  if ((await connection.getTransport()) !== "/active/prxy/libcurl/libcurl.mjs") {
    // NOTE: This logic in original file seemed mutually exclusive or redundant if it's checking '!= ...'
    // If the first if executes, the second might also execute if it just checks current state.
    // However, usually we just want ONE transport active. 
    // We will stick to epoxy as it's generally better for games like bloxd.io (Wisp support).
  }

  let viewUrl = __uv$config.prefix + __uv$config.encodeUrl(url);

  return viewUrl;
}
