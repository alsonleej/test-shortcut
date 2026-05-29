import * as pdfjsLib from "./pdfjs/build/pdf.mjs";
import { EventBus, PDFLinkService, PDFViewer } from "./pdfjs/web/pdf_viewer.mjs";

const PDF_URL = "./terms-and-conditions.pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdfjs/build/pdf.worker.mjs";

const container = document.getElementById("pdf-viewer-container");
const viewerElement = document.getElementById("pdf-viewer");
const pageLabel = document.getElementById("pdf-page-label");
const prevButton = document.getElementById("pdf-prev-page");
const nextButton = document.getElementById("pdf-next-page");
const zoomOutButton = document.getElementById("pdf-zoom-out");
const zoomInButton = document.getElementById("pdf-zoom-in");
const statusElement = document.getElementById("pdf-status");

function setPdfStatus(message, isError = false) {
  if (!statusElement) return;
  statusElement.textContent = message;
  statusElement.style.color = isError ? "#b91c1c" : "#4b5563";
}

function updatePageControls(pdfViewer) {
  const currentPage = pdfViewer.currentPageNumber;
  const totalPages = pdfViewer.pagesCount;

  if (pageLabel) {
    pageLabel.textContent = totalPages ? `Page ${currentPage} of ${totalPages}` : "";
  }
  if (prevButton) prevButton.disabled = currentPage <= 1;
  if (nextButton) nextButton.disabled = currentPage >= totalPages;
}

async function initPdfViewer() {
  if (!container || !viewerElement) return;

  const eventBus = new EventBus();
  const linkService = new PDFLinkService({ eventBus });
  const pdfViewer = new PDFViewer({
    container,
    viewer: viewerElement,
    eventBus,
    linkService,
    removePageBorders: false,
  });

  linkService.setViewer(pdfViewer);

  eventBus.on("pagesinit", () => {
    pdfViewer.currentScaleValue = "page-width";
    updatePageControls(pdfViewer);
  });

  eventBus.on("pagechanging", () => {
    updatePageControls(pdfViewer);
  });

  prevButton?.addEventListener("click", () => {
    pdfViewer.currentPageNumber = Math.max(1, pdfViewer.currentPageNumber - 1);
  });

  nextButton?.addEventListener("click", () => {
    pdfViewer.currentPageNumber = Math.min(pdfViewer.pagesCount, pdfViewer.currentPageNumber + 1);
  });

  zoomOutButton?.addEventListener("click", () => {
    pdfViewer.decreaseScale();
  });

  zoomInButton?.addEventListener("click", () => {
    pdfViewer.increaseScale();
  });

  try {
    setPdfStatus("Loading terms and conditions...");
    const loadingTask = pdfjsLib.getDocument(PDF_URL);
    const pdfDocument = await loadingTask.promise;
    pdfViewer.setDocument(pdfDocument);
    linkService.setDocument(pdfDocument, null);
    setPdfStatus("");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load PDF.";
    setPdfStatus(message, true);
  }
}

initPdfViewer();
