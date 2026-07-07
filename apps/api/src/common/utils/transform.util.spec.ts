import { emptyStringToUndefined } from './transform.util';

describe('emptyStringToUndefined', () => {
  it('converts an empty string to undefined', () => {
    expect(emptyStringToUndefined({ value: '' })).toBeUndefined();
  });

  it('leaves non-empty strings unchanged', () => {
    expect(emptyStringToUndefined({ value: '+8801700000000' })).toBe('+8801700000000');
  });

  it('leaves undefined unchanged', () => {
    expect(emptyStringToUndefined({ value: undefined })).toBeUndefined();
  });
});
