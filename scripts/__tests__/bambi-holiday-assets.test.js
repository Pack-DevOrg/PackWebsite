import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import zlib from 'node:zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const bambiHolidaysDir = path.join(repoRoot, 'public/clip-assets/bambi-holidays');

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const EXPECTED_WIDTH = 660;
const EXPECTED_HEIGHT = 440;
const EXPECTED_BIT_DEPTH = 8;
const PNG_COLOR_TYPE_RGBA = 6;
const ASSET_FILENAME_PATTERN = /^[a-z0-9_]+-[a-z]{2}\.png$/;

const VISIBLE_CELEBRATORY_US_HOLIDAY_IDS = [
  'new_years_day',
  'new_years_eve',
  'valentines_day',
  'presidents_day',
  'mardi_gras',
  'st_patricks_day',
  'nowruz',
  'holi',
  'easter',
  'cinco_de_mayo',
  'mothers_day',
  'fathers_day',
  'independence_day',
  'labor_day',
  'mid_autumn_festival',
  'halloween',
  'dia_de_los_muertos',
  'thanksgiving',
  'hanukkah',
  'christmas_eve',
  'christmas',
  'kwanzaa',
  'lunar_new_year',
];

const HIDDEN_OBSERVED_BY_HINT_IDS = [
  'good_friday',
  'purim',
  'passover',
  'rosh_hashanah',
  'yom_kippur',
  'eid_al_fitr',
  'eid_al_adha',
  'ramadan_begins',
  'diwali',
  'vesak',
];

const NON_CELEBRATORY_NO_OUTFIT_IDS = [
  'mlk_day',
  'memorial_day',
  'juneteenth',
  'veterans_day',
  'indigenous_peoples_day',
];

function paethPredictor(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const distLeft = Math.abs(estimate - left);
  const distAbove = Math.abs(estimate - above);
  const distUpperLeft = Math.abs(estimate - upperLeft);
  if (distLeft <= distAbove && distLeft <= distUpperLeft) {
    return left;
  }
  if (distAbove <= distUpperLeft) {
    return above;
  }
  return upperLeft;
}

function decodeRgbaPng(bytes) {
  assert.equal(
    bytes.length >= 33 && bytes.subarray(0, 8).equals(PNG_SIGNATURE),
    true,
    'expected 8-byte PNG signature',
  );

  let offset = 8;
  let ihdr = null;
  let sawIend = false;
  const idatChunks = [];

  while (offset + 12 <= bytes.length) {
    const chunkLen = bytes.readUInt32BE(offset);
    const chunkType = bytes.subarray(offset + 4, offset + 8).toString('ascii');
    const dataStart = offset + 8;
    const dataEnd = dataStart + chunkLen;
    assert.equal(dataEnd + 4 <= bytes.length, true, `truncated chunk ${chunkType}`);
    const chunkData = bytes.subarray(dataStart, dataEnd);

    if (ihdr === null) {
      assert.equal(chunkType, 'IHDR', 'first PNG chunk must be IHDR');
      assert.equal(chunkLen, 13, 'IHDR chunk must be 13 bytes');
      ihdr = {
        width: chunkData.readUInt32BE(0),
        height: chunkData.readUInt32BE(4),
        bitDepth: chunkData[8],
        colorType: chunkData[9],
        compression: chunkData[10],
        filter: chunkData[11],
        interlace: chunkData[12],
      };
    } else if (chunkType === 'IDAT') {
      idatChunks.push(chunkData);
    } else if (chunkType === 'IEND') {
      sawIend = true;
      break;
    }

    offset = dataEnd + 4;
  }

  assert.notEqual(ihdr, null, 'missing IHDR chunk');
  assert.equal(sawIend, true, 'missing IEND chunk');
  assert.equal(idatChunks.length > 0, true, 'missing IDAT chunks');
  assert.equal(ihdr.width, EXPECTED_WIDTH);
  assert.equal(ihdr.height, EXPECTED_HEIGHT);
  assert.equal(ihdr.bitDepth, EXPECTED_BIT_DEPTH);
  assert.equal(ihdr.colorType, PNG_COLOR_TYPE_RGBA);
  assert.equal(ihdr.compression, 0);
  assert.equal(ihdr.filter, 0);
  assert.equal(ihdr.interlace, 0);

  const inflated = zlib.inflateSync(Buffer.concat(idatChunks));
  const bytesPerPixel = 4;
  const stride = ihdr.width * bytesPerPixel;
  assert.equal(inflated.length, ihdr.height * (1 + stride), 'unexpected inflated RGBA length');

  const pixels = Buffer.alloc(ihdr.height * stride);
  for (let y = 0; y < ihdr.height; y += 1) {
    const rowInStart = y * (1 + stride);
    const filterType = inflated[rowInStart];
    const rowOutStart = y * stride;
    const prevRowOutStart = (y - 1) * stride;

    for (let x = 0; x < stride; x += 1) {
      const rawByte = inflated[rowInStart + 1 + x];
      const left = x >= bytesPerPixel ? pixels[rowOutStart + x - bytesPerPixel] : 0;
      const above = y > 0 ? pixels[prevRowOutStart + x] : 0;
      const upperLeft =
        y > 0 && x >= bytesPerPixel ? pixels[prevRowOutStart + x - bytesPerPixel] : 0;

      let recon = rawByte;
      if (filterType === 1) {
        recon = (rawByte + left) & 0xff;
      } else if (filterType === 2) {
        recon = (rawByte + above) & 0xff;
      } else if (filterType === 3) {
        recon = (rawByte + ((left + above) >> 1)) & 0xff;
      } else if (filterType === 4) {
        recon = (rawByte + paethPredictor(left, above, upperLeft)) & 0xff;
      } else {
        assert.equal(filterType, 0, `unsupported PNG filter type ${filterType}`);
      }
      pixels[rowOutStart + x] = recon;
    }
  }

  return { ihdr, pixels };
}

describe('public/clip-assets/bambi-holidays visible holiday cutouts', () => {
  it('publishes only the 23 owner-approved visible celebratory US holiday PNGs and zero hidden IDs', () => {
    assert.equal(fs.existsSync(bambiHolidaysDir), true, 'missing public/clip-assets/bambi-holidays');
    const entries = fs.readdirSync(bambiHolidaysDir).sort();

    for (const fileName of entries) {
      assert.match(fileName, ASSET_FILENAME_PATTERN);
    }

    const publishedIds = new Set(entries.map((fileName) => fileName.replace(/-[a-z]{2}\.png$/, '')));
    for (const hiddenId of HIDDEN_OBSERVED_BY_HINT_IDS) {
      assert.equal(
        publishedIds.has(hiddenId),
        false,
        `hidden observed_by_hint holiday ${hiddenId} must not be published in public/clip-assets/bambi-holidays`,
      );
    }
    for (const nonCelebratoryId of NON_CELEBRATORY_NO_OUTFIT_IDS) {
      assert.equal(
        publishedIds.has(nonCelebratoryId),
        false,
        `non-celebratory holiday ${nonCelebratoryId} must not be published in public/clip-assets/bambi-holidays`,
      );
    }

    const expectedFiles = VISIBLE_CELEBRATORY_US_HOLIDAY_IDS.map((id) => `${id}-us.png`).sort();
    assert.deepEqual(entries, expectedFiles);
    assert.equal(entries.length, 23);
  });

  for (const id of VISIBLE_CELEBRATORY_US_HOLIDAY_IDS) {
    it(`verifies ${id}-us.png is a 660x440 8-bit RGBA cutout with transparent corners and framed bounds`, () => {
      const filePath = path.join(bambiHolidaysDir, `${id}-us.png`);
      assert.equal(fs.existsSync(filePath), true);
      const bytes = fs.readFileSync(filePath);
      assert.equal(bytes.length > 150_000 && bytes.length < 600_000, true);

      const { ihdr, pixels } = decodeRgbaPng(bytes);
      assert.equal(ihdr.width, 660);
      assert.equal(ihdr.height, 440);

      for (const [startX, startY] of [
        [0, 0],
        [ihdr.width - 4, 0],
        [0, ihdr.height - 4],
        [ihdr.width - 4, ihdr.height - 4],
      ]) {
        for (let dy = 0; dy < 4; dy += 1) {
          for (let dx = 0; dx < 4; dx += 1) {
            const alphaOffset = ((startY + dy) * ihdr.width + (startX + dx)) * 4 + 3;
            assert.equal(
              pixels[alphaOffset],
              0,
              `expected corner alpha === 0 at (${startX + dx}, ${startY + dy}) in ${id}-us.png`,
            );
          }
        }
      }

      let transparentCount = 0;
      let solidForegroundCount = 0;
      let minX = ihdr.width;
      let minY = ihdr.height;
      let maxX = -1;
      let maxY = -1;

      for (let y = 0; y < ihdr.height; y += 1) {
        for (let x = 0; x < ihdr.width; x += 1) {
          const idx = (y * ihdr.width + x) * 4;
          const alpha = pixels[idx + 3];
          if (alpha === 0) {
            transparentCount += 1;
          } else if (alpha >= 250) {
            solidForegroundCount += 1;
          }
          if (alpha > 10) {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      }

      const totalPixels = ihdr.width * ihdr.height;
      assert.equal(transparentCount > totalPixels * 0.35, true);
      assert.equal(solidForegroundCount > totalPixels * 0.35, true);
      assert.equal(minX >= 2, true, `left edge clipped in ${id}-us.png: minX=${minX}`);
      assert.equal(minY >= 4, true, `top edge clipped in ${id}-us.png: minY=${minY}`);
      assert.equal(
        maxX <= ihdr.width - 3,
        true,
        `right edge clipped in ${id}-us.png: maxX=${maxX}`,
      );
      assert.equal(
        maxY <= ihdr.height - 5,
        true,
        `bottom edge clipped in ${id}-us.png: maxY=${maxY}`,
      );
    });
  }

  it('routes /clip-assets/bambi-holidays/<id>-us.png directly to S3 origin without SPA rewrite', () => {
    const cfSource = fs.readFileSync(
      path.join(__dirname, '../cloudfront/app-origin-viewer-request.js'),
      'utf8',
    );
    const sandbox = {
      require: () => ({ updateRequestOrigin: () => {} }),
    };
    vm.runInNewContext(cfSource, sandbox);

    for (const id of [
      'christmas',
      'easter',
      'holi',
      'dia_de_los_muertos',
      'cinco_de_mayo',
      'halloween',
      'hanukkah',
      'lunar_new_year',
    ]) {
      const uri = `/clip-assets/bambi-holidays/${id}-us.png`;
      const wwwResult = sandbox.handler({
        request: {
          uri,
          headers: { host: { value: 'www.trypackai.com' } },
          querystring: {},
        },
      });
      assert.equal(wwwResult.statusCode, undefined);
      assert.equal(wwwResult.uri, uri);

      const apexResult = sandbox.handler({
        request: {
          uri,
          headers: { host: { value: 'trypackai.com' } },
          querystring: {},
        },
      });
      assert.equal(apexResult.statusCode, 301);
      assert.equal(apexResult.headers.location.value, `https://www.trypackai.com${uri}`);
    }
  });
});
