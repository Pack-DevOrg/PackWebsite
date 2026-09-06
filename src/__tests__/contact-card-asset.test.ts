import {createHash} from 'crypto';
import {existsSync, readFileSync} from 'fs';
import {join} from 'path';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CONTACT_CARD_SHA256 =
  '39c2f44914c8799927464e9377a62e5251a4b4bf1d01c4aeb2d798b7e4a70fdc';

function ihdrSize(png: Buffer): {width: number; height: number} {
  if (png.length < 24) {
    throw new Error('PNG too short for IHDR');
  }
  return {width: png.readUInt32BE(16), height: png.readUInt32BE(20)};
}

describe('contact-card asset', () => {
  const contactCard = join(process.cwd(), 'public/contact-card.png');
  const appleTouch = join(process.cwd(), 'public/apple-touch-icon.png');
  const logo = join(process.cwd(), 'public/logo.png');

  it('exists at public/contact-card.png', () => {
    expect(existsSync(contactCard)).toBe(true);
  });

  it('starts with the PNG signature', () => {
    const bytes = readFileSync(contactCard);
    expect(Buffer.from(bytes.subarray(0, 8)).equals(PNG_SIGNATURE)).toBe(true);
  });

  it('is square (IHDR width === height)', () => {
    const {width, height} = ihdrSize(readFileSync(contactCard));
    expect(width).toBe(height);
  });

  it('is not identical to public/apple-touch-icon.png', () => {
    const card = readFileSync(contactCard);
    const apple = readFileSync(appleTouch);
    expect(Buffer.from(card).equals(Buffer.from(apple))).toBe(false);
  });

  it('is a copy of public/logo.png', () => {
    const card = readFileSync(contactCard);
    const mark = readFileSync(logo);
    expect(Buffer.from(card).equals(Buffer.from(mark))).toBe(true);
  });

  it('pins SHA256 of the Pack logo mark', () => {
    const digest = createHash('sha256').update(readFileSync(contactCard)).digest('hex');
    expect(digest).toBe(CONTACT_CARD_SHA256);
  });
});
