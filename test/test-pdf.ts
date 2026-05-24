import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateCertificate } from "../src/services/cert-generator.js";
import { convertPngToPdf } from "../src/services/pdf.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, "output");

async function runTest() {
  console.log("Generating certificate PNG...");

  const textTopOffset = "290px";
  const textColor = "#073b1a";
  const templateFilename = "pm-workshop-optimized.jpg";
  const displayName = "Juan Dela Cruz";

  const pngBuffer = await generateCertificate({
    displayName,
    topOffset: textTopOffset,
    textColor,
  });

  console.log("Converting to PDF...");
  const pdfBuffer = await convertPngToPdf(pngBuffer, templateFilename);

  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, "test-output.pdf");
  await fs.writeFile(outputPath, pdfBuffer);

  console.log(`Success! Test PDF generated at: ${outputPath}`);
}

runTest().catch(console.error);
