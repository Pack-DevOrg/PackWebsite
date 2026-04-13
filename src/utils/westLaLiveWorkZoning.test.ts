import {
  classifyLiveWorkCategory,
  extractBaseZone,
} from './westLaLiveWorkZoning';

describe('westLaLiveWorkZoning', () => {
  it('extracts a base zone from qualified zoning strings', () => {
    expect(extractBaseZone('(T)(Q)RAS4-1VL-RIO')).toBe('RAS4');
    expect(extractBaseZone('[Q]M1-1-SN')).toBe('M1');
    expect(extractBaseZone('C1.5-1')).toBe('C1.5');
  });

  it('classifies artist joint living/work screening zones', () => {
    expect(classifyLiveWorkCategory('(Q)MR1-1')).toBe('artistJointLivingWork');
    expect(classifyLiveWorkCategory('(T)[Q]M1-1-SN')).toBe('artistJointLivingWork');
  });

  it('classifies adaptive reuse screening zones', () => {
    expect(classifyLiveWorkCategory('(Q)RAS3-1')).toBe('adaptiveReuse');
    expect(classifyLiveWorkCategory('CM-1')).toBe('adaptiveReuse');
  });

  it('returns null for zones outside the screening lists', () => {
    expect(classifyLiveWorkCategory('R1-1')).toBeNull();
    expect(classifyLiveWorkCategory(undefined)).toBeNull();
  });
});
