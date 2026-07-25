import { extractText, getDocumentProxy } from "unpdf";

/**
 * Extracts raw textual layout from an incoming PDF document binary stream buffer.
 */
export async function extractTextFromPDF(fileBuffer: Buffer): Promise<string> {
  try {
    const pdfProxy = await getDocumentProxy(new Uint8Array(fileBuffer));
    const extracted = await extractText(pdfProxy, { mergePages: true });
    return extracted.text || "";
  } catch (error) {
    throw new Error("Failed to properly read or decode the uploaded PDF document structure.");
  }
}