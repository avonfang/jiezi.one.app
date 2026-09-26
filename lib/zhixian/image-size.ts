// 纯 JS 解析图片尺寸（不引入依赖）。用于后端检测通义万相对 512px 的最低要求。
export type ImageSize = { width: number; height: number };

export function parseImageSize(dataUri: string): ImageSize | null {
  const m = /^data:image\/(jpe?g|png|webp);base64,([\s\S]*)$/i.exec(dataUri);
  if (!m) return null;
  const type = m[1].toLowerCase();
  const buf = Buffer.from(m[2], 'base64');
  try {
    if (type === 'png') {
      if (buf.length < 24) return null;
      // PNG 签名 8 字节 + IHDR length(4) + 'IHDR'(4) + width(4) + height(4)
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    if (type === 'jpeg' || type === 'jpg') {
      let i = 2;
      while (i < buf.length) {
        if (buf[i] !== 0xff) { i++; continue; }
        const marker = buf[i + 1];
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
        }
        i += 2;
        const len = buf.readUInt16BE(i);
        i += len;
      }
      return null;
    }
    if (type === 'webp') {
      if (buf.length < 30) return null;
      const chunk = buf.toString('ascii', 12, 16);
      if (chunk === 'VP8X') {
        return { width: 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16)), height: 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16)) };
      }
      if (chunk === 'VP8 ') {
        return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
      }
      if (chunk === 'VP8L') {
        const b = buf.readUInt32LE(21);
        return { width: 1 + (b & 0x3fff), height: 1 + ((b >> 14) & 0x3fff) };
      }
      return null;
    }
  } catch {
    return null;
  }
  return null;
}
