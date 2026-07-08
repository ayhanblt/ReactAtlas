const sharp = require('sharp');
const fs = require('fs');

async function convert() {
  const svgBuffer = fs.readFileSync('public/logo.svg');
  
  // Favicon (32x32)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile('public/favicon.png');
    
  // Apple Touch Icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile('public/apple-icon.png');
    
  console.log('Icons generated successfully.');
}
convert().catch(console.error);
