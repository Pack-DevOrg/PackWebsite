import {existsSync, readFileSync} from 'fs';
import {join} from 'path';

const OVERLAY_IDS = [
  'drizzle',
  'fog',
  'haze',
  'night-overcast',
  'night',
  'overcast',
  'rain',
  'snow',
  'storm',
  'sun-clouds',
  'sun',
  'wind',
] as const;

describe('weather-fx hero HEVC-with-alpha assets', () => {
  const assetDir = join(process.cwd(), 'public/assets/weather-fx/v1');

  it.each(OVERLAY_IDS)(
    'stages %s.hero.hevc.mov as a 1536x512 32-bit QuickTime HEVC-with-alpha container',
    (id) => {
      const filePath = join(assetDir, `${id}.hero.hevc.mov`);
      expect(existsSync(filePath)).toBe(true);
      const bytes = readFileSync(filePath);
      expect(bytes.length).toBeGreaterThan(100_000);
      expect(bytes.length).toBeLessThan(3 * 1024 * 1024);
      expect(bytes.subarray(4, 10).toString('ascii')).toBe('ftypqt');
      const hvc1Offset = bytes.indexOf(Buffer.from('hvc1', 'ascii'));
      expect(hvc1Offset).toBeGreaterThan(0);
      expect(bytes.readUInt16BE(hvc1Offset + 28)).toBe(1536);
      expect(bytes.readUInt16BE(hvc1Offset + 30)).toBe(512);
      expect(bytes.readUInt16BE(hvc1Offset + 78)).toBe(32);
    },
  );
});
