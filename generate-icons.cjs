const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lengthBuf, typeBuf, data, crcBuf]);
}

function createPNG(width, height, drawFn) {
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    rawData[y * rowSize] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const offset = y * rowSize + 1 + x * 4;
      rawData[offset] = r;
      rawData[offset + 1] = g;
      rawData[offset + 2] = b;
      rawData[offset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdrData),
    createChunk('IDAT', compressed),
    createChunk('IEND', Buffer.alloc(0))
  ]);
}

function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

function iconDraw(x, y, w, h) {
  const cx = w / 2, cy = h / 2;
  const dx = x - cx, dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  const t = dist / maxDist;

  const r = lerp(102, 118, t);
  const g = lerp(126, 75, t);
  const b = lerp(234, 162, t);

  const padding = Math.max(1, Math.floor(w * 0.12));
  if (x < padding || x >= w - padding || y < padding || y >= h - padding) {
    return [r, g, b, 255];
  }

  const innerW = w - 2 * padding;
  const barCount = 4;
  const barW = innerW / (barCount * 2 - 1);
  const barHeights = [0.35, 0.6, 0.45, 0.8];
  const baseY = h - padding;

  for (let i = 0; i < barCount; i++) {
    const barX = padding + i * barW * 2;
    const barH = barHeights[i] * (h - 2 * padding);
    const barTop = baseY - barH;

    if (x >= barX && x < barX + barW && y >= barTop && y < baseY) {
      const isLight = (i % 2 === 0);
      return isLight ? [255, 255, 255, 230] : [255, 220, 100, 230];
    }
  }

  return [r, g, b, 255];
}

const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

[16, 48, 128].forEach(function(size) {
  const png = createPNG(size, size, iconDraw);
  const filePath = path.join(iconsDir, 'icon' + size + '.png');
  fs.writeFileSync(filePath, png);
  console.log('Generated ' + filePath + ' (' + png.length + ' bytes)');
});
