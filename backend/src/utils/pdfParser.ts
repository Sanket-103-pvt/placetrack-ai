import pdfParse from "pdf-parse";

/**
 * Extracts raw textual layout from an incoming PDF document binary stream buffer.
 */
export async function extractTextFromPDF(fileBuffer: Buffer): Promise<string> {
  try {
    const parsedData = await pdfParse(fileBuffer);
    return parsedData.text || "";
  } catch (error) {
    throw new Error("Failed to properly read or decode the uploaded PDF document structure.");
  }
}