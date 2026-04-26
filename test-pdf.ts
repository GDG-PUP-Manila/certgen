import fs from "node:fs/promises";
import path from "node:path";
import { generateCertificate } from "./src/services/cert-generator.js";
import { convertPngToPdf } from "./src/services/pdf.service.js";

async function runTest() {
  console.log("Generating certificate PNG...");
  
  // You can change the topOffset here to test different values
  const textTopOffset = "310px";
  const templateFilename = "bwai-template-optimized.jpg";
  const displayName = "Juan Dela Cruz";

  const pngBuffer = await generateCertificate({
    displayName,
    topOffset: textTopOffset,
  });

  console.log("Converting to PDF...");
  const pdfBuffer = await convertPngToPdf(pngBuffer, templateFilename);

  const outputPath = path.resolve("./test-output.pdf");
  await fs.writeFile(outputPath, pdfBuffer);

  console.log(`✅ Success! Test PDF generated at: ${outputPath}`);
}

runTest().catch(console.error);
