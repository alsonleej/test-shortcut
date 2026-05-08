function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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

export function renderBadgeTemplate(templateHtml, values) {
  return Object.entries(values).reduce(
    (html, [key, value]) => html.replaceAll(`{{${key}}}`, escapeHtml(String(value))),
    templateHtml
  );
} 

export function printBadge(badgeHtml, newTitle) {
  const androidBridge = window?.Android;
  if (typeof androidBridge?.printPage === "function") {
    androidBridge.printPage(badgeHtml, newTitle);
  }
}
