import { generateFeatureChecks } from '../src/feature-detect';
import { FeaturePolyfills } from '../src/feature-list';

/**
 * Feature detect generation script
 */
describe('Feature detect generation', () => {
  it('works if `fetch` feature detection is correctly generated', () => {
    const result = `('fetch' in window) || _nextscript_feats.push('fetch');`;
    const featureChecks = generateFeatureChecks([FeaturePolyfills.FETCH]);

    expect(featureChecks).toEqual(result);
  });

  it('works if a category-based feature detection is correctly generated', () => {
    const result = `_nextscript_feats.push('${FeaturePolyfills.DEFAULT.feature}');`;
    const featureChecks = generateFeatureChecks([FeaturePolyfills.DEFAULT]);

    expect(featureChecks).toEqual(result);
  });
});
