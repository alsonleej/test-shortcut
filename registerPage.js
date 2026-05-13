import { embedBadgeImagesAsDataUris, printBadge, renderBadgeTemplate } from "./printBadge.js";

const form = document.getElementById("register-form");
const status = document.getElementById("status");

function setStatus(message, isError = false) {
  if (!status) return;
  status.textContent = message;
  status.style.color = isError ? "#b91c1c" : "#166534";
}

function isValidCssPadding(value) {
  return CSS.supports("padding", value);
}

function isValidCssFontSize(value) {
  return CSS.supports("font-size", value);
}

function applyTemplateStyleOverrides(
  html,
  { containerPadding, nameCompactFontSize, reasonCompactFontSize }
) {
  return html
    .replace("padding: 20px 10px;", `padding: ${containerPadding};`)
    .replace(
      /\.name\.compact\s*\{\s*font-size:\s*[^;]+;/,
      `.name.compact {\n      font-size: ${nameCompactFontSize};`
    )
    .replace(
      /\.reason\.compact\s*\{\s*font-size:\s*[^;]+;/,
      `.reason.compact {\n      font-size: ${reasonCompactFontSize};`
    );
}

async function loadBadgeTemplate() {
  const response = await fetch("./visitorBadgeTemplate.html", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load visitor badge template.");
  return response.text();
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("Preparing badge...");

    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const reason = String(formData.get("reason") ?? "").trim();
    const host = String(formData.get("host") ?? "").trim();
    const containerPadding = String(formData.get("containerPadding") ?? "").trim();
    const nameCompactFontSize = String(formData.get("nameCompactFontSize") ?? "").trim();
    const reasonCompactFontSize = String(formData.get("reasonCompactFontSize") ?? "").trim();

    if (
      !name ||
      !reason ||
      !host ||
      !containerPadding ||
      !nameCompactFontSize ||
      !reasonCompactFontSize
    ) {
      setStatus("Please fill all fields.", true);
      return;
    }
    if (!isValidCssPadding(containerPadding)) {
      setStatus('Padding must be a valid CSS value (example: "20px 10px").', true);
      return;
    }
    if (!isValidCssFontSize(nameCompactFontSize) || !isValidCssFontSize(reasonCompactFontSize)) {
      setStatus('Compact font size must be a valid CSS font-size (example: "48px").', true);
      return;
    }

    try {
      const templateHtml = await loadBadgeTemplate();
      const templateWithImages = await embedBadgeImagesAsDataUris(templateHtml);
      const badgeHtml = await renderBadgeTemplate(templateWithImages, {
        name,
        reason,
        host,
      });
      const badgeHtmlWithStyleOverrides = applyTemplateStyleOverrides(badgeHtml, {
        containerPadding,
        nameCompactFontSize,
        reasonCompactFontSize,
      });
      printBadge(badgeHtmlWithStyleOverrides, `Visitor Badge - ${name}`);
      setStatus("Print request sent to Android.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unexpected error.", true);
    }
  });
}
