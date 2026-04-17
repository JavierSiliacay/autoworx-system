import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

async function walkDir(dir: string, callback: (filePath: string) => Promise<void>) {
    const files = await readdir(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const fileStat = await stat(filePath);
        if (fileStat.isDirectory()) {
            await walkDir(filePath, callback);
        } else {
            await callback(filePath);
        }
    }
}

async function convertToWebP(filePath: string) {
    const ext = path.extname(filePath).toLowerCase();
    if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        const webpPath = filePath.replace(ext, '.webp');
        
        // Skip if webp version already exists
        if (fs.existsSync(webpPath)) {
            console.log(`Skipping (already exists): ${path.basename(filePath)}`);
            return;
        }

        try {
            console.log(`Converting: ${path.basename(filePath)}...`);
            await sharp(filePath)
                .webp({ quality: 80 })
                .toFile(webpPath);
            console.log(`✅ Success: ${path.basename(webpPath)}`);
        } catch (err) {
            console.error(`❌ Failed: ${path.basename(filePath)}`, err);
        }
    }
}

// Default to scanning the public directory
const targetDir = path.join(process.cwd(), 'public');

console.log(`Starting Batch Conversion in: ${targetDir}`);
walkDir(targetDir, convertToWebP)
    .then(() => console.log('--- Conversion Complete ---'))
    .catch(err => console.error('Error during conversion:', err));
