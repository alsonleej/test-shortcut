let liquidEngine;

function getLiquidEngine() {
  if (!liquidEngine) {
    const Liquid = window?.liquidjs?.Liquid;
    if (!Liquid) {
      throw new Error("Liquid template engine failed to load.");
    }
    liquidEngine = new Liquid();
  }
  return liquidEngine;
}

/**
 * Fetches a PNG and returns a data URL: `data:image/png;base64,<raw base64>`.
 */
async function fetchPngAsDataUri(relativeUrl) {
  const response = await fetch(relativeUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load image: ${relativeUrl}`);
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image as base64."));
    reader.readAsDataURL(blob);
  });
}

/**
 * Replaces `logo.png` / `qr.png` img sources with inline PNG data URIs so the
 * printed HTML does not depend on separate asset URLs.
 */
export async function embedBadgeImagesAsDataUris(templateHtml) {
  const [logoDataUri, qrDataUri] = await Promise.all([
    fetchPngAsDataUri("./logo.png"),
    fetchPngAsDataUri("./qr.png"),
  ]);

  const escapeDataUriForHtmlAttribute = (dataUri) =>
    String(dataUri).replaceAll("&", "&amp;").replaceAll('"', "&quot;");

  let html = templateHtml;
  html = html.replaceAll('src="logo.png"', `src="${escapeDataUriForHtmlAttribute(logoDataUri)}"`);
  html = html.replaceAll("src='logo.png'", `src='${escapeDataUriForHtmlAttribute(logoDataUri)}'`);
  html = html.replaceAll('src="qr.png"', `src="${escapeDataUriForHtmlAttribute(qrDataUri)}"`);
  html = html.replaceAll("src='qr.png'", `src='${escapeDataUriForHtmlAttribute(qrDataUri)}'`);
  return html;
}

export async function renderBadgeTemplate(templateHtml, values) {
  const liquidEngine = getLiquidEngine();
  return liquidEngine.parseAndRender(templateHtml, values);
}

export function printBadge(badgeHtml, newTitle) {
  const androidBridge = window?.Android;
  if (typeof androidBridge?.printPage !== "function") {
    return false;
  }
  androidBridge.printPage(badgeHtml, newTitle);
  return true;
}
