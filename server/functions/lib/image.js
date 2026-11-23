// Structural validation and dimension limits, not an antivirus or full image decoder.
// Keep identical acceptance rules for local and production upload endpoints.
const invalid = () => { throw Object.assign(new Error('Choose a valid PNG, JPEG or WebP image under 2 MB (maximum 40 megapixels).'), { status: 400 }); };
export function validateImage(encoded) {
  if (typeof encoded !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) invalid();
  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.length < 24 || bytes.length > 2000000 || bytes.toString('base64') !== encoded) invalid();
  let extension, width, height;
  if (bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    extension = 'png'; let offset = 8, sawHeader = false, sawData = false, sawEnd = false;
    while (offset + 12 <= bytes.length) {
      const length = bytes.readUInt32BE(offset), type = bytes.toString('ascii', offset+4, offset+8);
      if (length > bytes.length - offset - 12) invalid();
      if (!sawHeader && type !== 'IHDR') invalid();
      if (type === 'IHDR') { if (sawHeader || length !== 13) invalid(); sawHeader = true; width = bytes.readUInt32BE(offset+8); height = bytes.readUInt32BE(offset+12); }
      if (type === 'IDAT') sawData = true;
      offset += length + 12;
      if (type === 'IEND') { if (length !== 0 || offset !== bytes.length) invalid(); sawEnd = true; break; }
    }
    if (!sawHeader || !sawData || !sawEnd) invalid();
  } else if (bytes[0] === 255 && bytes[1] === 216 && bytes[bytes.length-2] === 255 && bytes[bytes.length-1] === 217) {
    extension = 'jpg'; let offset = 2, scan = false;
    while (offset + 4 <= bytes.length) {
      if (bytes[offset++] !== 255) invalid();
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 218) { scan = true; break; }
      if (marker === 217) break;
      if (offset + 2 > bytes.length) invalid();
      const length = bytes.readUInt16BE(offset);
      if (length < 2 || offset + length > bytes.length) invalid();
      if ([192,193,194].includes(marker)) { if (length < 8) invalid(); height = bytes.readUInt16BE(offset+3); width = bytes.readUInt16BE(offset+5); }
      offset += length;
    }
    if (!scan) invalid();
  } else if (bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP' && bytes.readUInt32LE(4) + 8 === bytes.length) {
    extension = 'webp'; let offset = 12, foundImage = false;
    while (offset + 8 <= bytes.length) {
      const type = bytes.toString('ascii',offset,offset+4), length = bytes.readUInt32LE(offset+4), start = offset+8;
      if (start + length > bytes.length) invalid();
      if (type === 'VP8 ' && length >= 10 && bytes.subarray(start+3,start+6).equals(Buffer.from([157,1,42]))) { width = bytes.readUInt16LE(start+6) & 16383; height = bytes.readUInt16LE(start+8) & 16383; foundImage = true; }
      if (type === 'VP8L' && length >= 5 && bytes[start] === 47) { const bits = bytes.readUInt32LE(start+1); width = (bits & 16383)+1; height = ((bits >>> 14) & 16383)+1; foundImage = true; }
      offset = start + length + (length % 2);
    }
    if (!foundImage || offset !== bytes.length) invalid();
  } else invalid();
  if (!width || !height || width > 12000 || height > 12000 || width * height > 40000000) invalid();
  return { bytes, extension, width, height };
}
