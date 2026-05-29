const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

const outputPath = path.join(__dirname, "..", "terms-and-conditions.pdf");

const sections = [
  {
    title: "Visitor Terms and Conditions",
    body: [
      "Welcome to our facility. By registering as a visitor, you agree to follow all site policies, safety instructions, and staff directions while on the premises.",
      "This document is provided for kiosk testing of in-page PDF viewing with PDF.js.",
    ],
  },
  {
    title: "1. Access and Conduct",
    body: [
      "Visitors must check in at the kiosk and wear a visible badge at all times.",
      "Harassment, unauthorized photography, and access to restricted areas are prohibited.",
      "Smoking, vaping, and alcohol consumption are not permitted unless explicitly authorized.",
    ],
  },
  {
    title: "2. Safety and Security",
    body: [
      "Follow posted evacuation routes and participate in drills when requested.",
      "Report suspicious activity, spills, or injuries to security or your host immediately.",
      "Personal belongings remain your responsibility; the facility is not liable for lost items.",
    ],
  },
  {
    title: "3. Data and Privacy",
    body: [
      "Registration information is used for access control, host notification, and audit logs.",
      "CCTV may operate in common areas for safety and security purposes.",
      "Do not share access credentials, QR codes, or badge details with others.",
    ],
  },
  {
    title: "4. Acknowledgement",
    body: [
      "Submitting the visitor registration form indicates that you have read and accept these terms.",
      "If you do not agree, please contact reception before proceeding.",
      "Last updated: May 29, 2026.",
    ],
  },
];

function wrapText(text, font, fontSize, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(candidate, fontSize);
    if (width <= maxWidth) {
      currentLine = candidate;
      continue;
    }
    if (currentLine) lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

async function createTermsPdf() {
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 54;
  const contentWidth = pageWidth - margin * 2;
  const titleSize = 18;
  const headingSize = 13;
  const bodySize = 11;
  const lineGap = 4;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const drawLine = (text, font, size, color = rgb(0.1, 0.1, 0.1)) => {
    if (y < margin + size) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    page.drawText(text, { x: margin, y: y - size, size, font, color });
    y -= size + lineGap;
  };

  drawLine("Visitor Terms and Conditions", bold, titleSize, rgb(0.05, 0.2, 0.45));
  y -= 8;

  for (const section of sections) {
    if (section.title !== "Visitor Terms and Conditions") {
      y -= 6;
      drawLine(section.title, bold, headingSize);
      y -= 2;
    }

    for (const paragraph of section.body) {
      const lines = wrapText(paragraph, regular, bodySize, contentWidth);
      for (const line of lines) {
        drawLine(line, regular, bodySize);
      }
      y -= 6;
    }
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`Wrote ${outputPath}`);
}

createTermsPdf().catch((error) => {
  console.error(error);
  process.exit(1);
});
