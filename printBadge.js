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
 * Loads an image and re-encodes it as a PNG data URL so the print path gets a
 * consistent RGBA bitmap instead of source-specific PNG variants.
 */
async function fetchPngAsDataUri(relativeUrl) {
  const response = await fetch(relativeUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load image: ${relativeUrl}`);
  }
  const blob = await response.blob();
  let imageBitmap;
  try {
    imageBitmap = await createImageBitmap(blob);
  } catch {
    throw new Error(`Could not decode image: ${relativeUrl}`);
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error(`Could not create drawing context for ${relativeUrl}`);
    }
    context.drawImage(imageBitmap, 0, 0);
    return canvas.toDataURL("image/png");
  } finally {
    imageBitmap.close();
  }
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
