const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const INPUT_DIR = path.join(__dirname, "..", "public", "cards");
const WEBP_DIR = path.join(__dirname, "..", "public", "cards-webp");
const THUMB_DIR = path.join(__dirname, "..", "public", "cards-thumb");

// Create output directories
fs.mkdirSync(WEBP_DIR, { recursive: true });
fs.mkdirSync(THUMB_DIR, { recursive: true });

const files = fs.readdirSync(INPUT_DIR).filter((f) => f.endsWith(".png"));

console.log(`Found ${files.length} PNG files to optimize.\n`);

async function optimize() {
  for (const file of files) {
    const inputPath = path.join(INPUT_DIR, file);
    const name = path.parse(file).name;

    // High-res WebP (800px wide, quality 82)
    await sharp(inputPath)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(WEBP_DIR, `${name}.webp`));

    // Thumbnail WebP (320px wide, quality 75)
    await sharp(inputPath)
      .resize({ width: 320, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toFile(path.join(THUMB_DIR, `${name}.webp`));

    // Log sizes
    const origSize = (fs.statSync(inputPath).size / 1024).toFixed(0);
    const webpSize = (
      fs.statSync(path.join(WEBP_DIR, `${name}.webp`)).size / 1024
    ).toFixed(0);
    const thumbSize = (
      fs.statSync(path.join(THUMB_DIR, `${name}.webp`)).size / 1024
    ).toFixed(0);

    console.log(
      `${file}: ${origSize}KB PNG → ${webpSize}KB WebP / ${thumbSize}KB thumb`
    );
  }

  console.log("\nOptimization complete!");
  console.log(`Output: ${WEBP_DIR}/ (${files.length} files)`);
  console.log(`Output: ${THUMB_DIR}/ (${files.length} files)`);
}

optimize().catch(console.error);
