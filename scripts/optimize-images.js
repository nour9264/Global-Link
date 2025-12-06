const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'public', 'images');

async function optimizeImages() {
    console.log('Starting image optimization...');

    const images = [
        {
            input: 'globallink-logo.png',
            output: 'globallink-logo.webp',
            width: 160,
            quality: 90
        },
        {
            input: 'globallink-logo-dark.png',
            output: 'globallink-logo-dark.webp',
            width: 160,
            quality: 90
        }
    ];

    for (const img of images) {
        const inputPath = path.join(imagesDir, img.input);
        const outputPath = path.join(imagesDir, img.output);

        if (fs.existsSync(inputPath)) {
            try {
                await sharp(inputPath)
                    .resize(img.width, null, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .webp({ quality: img.quality })
                    .toFile(outputPath);

                const inputSize = fs.statSync(inputPath).size;
                const outputSize = fs.statSync(outputPath).size;
                const savings = ((inputSize - outputSize) / inputSize * 100).toFixed(2);

                console.log(`✓ ${img.input} → ${img.output}`);
                console.log(`  Size: ${(inputSize / 1024).toFixed(2)} KB → ${(outputSize / 1024).toFixed(2)} KB (${savings}% reduction)`);
            } catch (error) {
                console.error(`✗ Failed to optimize ${img.input}:`, error.message);
            }
        } else {
            console.log(`⚠ ${img.input} not found, skipping...`);
        }
    }

    console.log('\nImage optimization complete!');
}

optimizeImages().catch(console.error);
