/**
 * Simple script to create placeholder icons for the extension
 * In production, you would use proper icon files
 */

const fs = require('fs');
const path = require('path');

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

// Create SVG icon template
const createIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
    </defs>
    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="url(#grad)" stroke="#fff" stroke-width="2"/>
    <circle cx="${size/2 - size/6}" cy="${size/2 - size/8}" r="${size/8}" fill="#fff" opacity="0.9"/>
    <circle cx="${size/2 + size/6}" cy="${size/2 - size/8}" r="${size/8}" fill="#fff" opacity="0.9"/>
    <circle cx="${size/2 - size/6}" cy="${size/2 - size/8}" r="${size/16}" fill="#333"/>
    <circle cx="${size/2 + size/6}" cy="${size/2 - size/8}" r="${size/16}" fill="#333"/>
    <text x="${size/2}" y="${size/2 + size/4}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size/6}" fill="#fff">👁️</text>
</svg>
`.trim();

// Create placeholder icons
const sizes = [16, 32, 48, 128];

sizes.forEach(size => {
    const svgContent = createIcon(size);
    const filename = `icon${size}.svg`;
    const filepath = path.join(assetsDir, filename);
    
    fs.writeFileSync(filepath, svgContent, 'utf8');
    console.log(`Created ${filename}`);
    
    // Also create a simple PNG placeholder by copying the SVG
    // In production, you would convert SVG to PNG properly
    const pngFilename = `icon${size}.png`;
    const pngFilepath = path.join(assetsDir, pngFilename);
    
    // For now, just copy the SVG content as a text file with .png extension
    // This is just for development - in production you'd use proper PNG files
    fs.writeFileSync(pngFilepath, svgContent, 'utf8');
    console.log(`Created placeholder ${pngFilename}`);
});

console.log('Icon creation completed!');
console.log('Note: In production, replace these with proper PNG/ICO files.');