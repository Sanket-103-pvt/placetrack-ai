import { getDocumentProxy } from "unpdf";

/**
 * Extracts raw textual layout from an incoming PDF document binary stream buffer.
 */
export async function extractTextFromPDF(fileBuffer: Buffer): Promise<string> {
  try {
    const pdfProxy = await getDocumentProxy(new Uint8Array(fileBuffer));
    let extractedText = "";
    for (let i = 1; i <= pdfProxy.numPages; i++) {
      const page = await pdfProxy.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || "")
        .join(" ");
      extractedText += pageText + "\n";
    }
    return extractedText || "";
  } catch (error) {
    throw new Error("Failed to properly read or decode the uploaded PDF document structure.");
  }
}