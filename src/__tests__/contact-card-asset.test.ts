import {createHash} from 'crypto';
import {existsSync, readFileSync} from 'fs';
import {join} from 'path';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CONTACT_CARD_SHA256 =
  'e2207cfc39711c7501defe2253d9f41576d8bad1c4969fdf3398d127fa06d667';
const PNG_COLOR_TYPE_RGB = 2;
const OLD_TRANSPARENT_CARD_BYTES = 106832;

function ihdr(png: Buffer): {width: number; height: number; colorType: number} {
  if (png.length < 26) {
    throw new Error('PNG too short for IHDR');
  }
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
    colorType: png[25],
  };
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

  it('is 512² opaque RGB (no alpha for iOS circular crop)', () => {
    const bytes = readFileSync(contactCard);
    const {width, height, colorType} = ihdr(bytes);
    expect(width).toBe(512);
    expect(height).toBe(512);
    expect(colorType).toBe(PNG_COLOR_TYPE_RGB);
    expect(bytes.length).not.toBe(OLD_TRANSPARENT_CARD_BYTES);
    expect(bytes.length).toBeGreaterThan(50_000);
    expect(bytes.length).toBeLessThan(80_000);
  });

  it('is not identical to public/apple-touch-icon.png', () => {
    const card = readFileSync(contactCard);
    const apple = readFileSync(appleTouch);
    expect(Buffer.from(card).equals(Buffer.from(apple))).toBe(false);
  });

  it('composes public/logo.png onto a black field (not a raw copy)', () => {
    const card = readFileSync(contactCard);
    const mark = readFileSync(logo);
    expect(Buffer.from(card).equals(Buffer.from(mark))).toBe(false);
  });

  it('pins SHA256 of the circular-crop contact card', () => {
    const digest = createHash('sha256').update(readFileSync(contactCard)).digest('hex');
    expect(digest).toBe(CONTACT_CARD_SHA256);
  });
});
