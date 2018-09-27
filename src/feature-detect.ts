// tslint:disable max-line-length
import { PolyfillDefinition } from './feature-list';

// Required features
// https://polyfill.io/v2/docs/api

export interface ScriptEntry {
  src: string;
  nonce?: string;
  id?: string;
  async?: boolean;
}

export interface FeatureDetectProps {
  scripts: string;
  allowUserMonitoring?: boolean;
  minify?: boolean;
  useFeatureDetection?: boolean;
  features?: PolyfillDefinition[];
}

export const generateFeatureChecks = (features: PolyfillDefinition[] = []) => {
  return features.map((item) => {
    if (item.test) {
      return `${item.test} || _nextscript_feats.push('${item.feature}');`;
    }
    return `_nextscript_feats.push('${item.feature}');`;
  }).join('\n');
};

export const featureDetect = ({ scripts, minify = true, allowUserMonitoring = true, useFeatureDetection = true, features = [] }: FeatureDetectProps) => {
  const flags = `gated${useFeatureDetection ? ',always' : ''}`;
  const ua = useFeatureDetection ? '&ua=chrome/69.0.0' : ''; // latest chrome.

  return `
  var _nextscript_feats = [];
  if (${useFeatureDetection}) {
    ${generateFeatureChecks(features)}
  } else {
    _nextscript_feats.push('default');
  }

  function cs(src, isAsync, useHead, nonce, id) {
    var s = document.createElement('script');
    s.src = src;
    s.async = isAsync;
    if (nonce) { s.nonce = nonce; }
    if (id){ s.id = id; }
    if (useHead) {
      document.head.appendChild(s);
    } else {
      document.body.appendChild(s);
    }
  }

  if (_nextscript_feats.length) {
    // Include a 'ua' argument set to a browser requiring no polyfills to skip UA identification
    // (improves response time) and avoid being treated as unknown UA (which would
    // otherwise result in no polyfills, even with 'always', if UA is unknown). Force always
    // since our feature detection already told us we need them.
    var src = 'https://cdn.polyfill.io/v2/polyfill.${minify ? 'min.' : ''}js?features=' + _nextscript_feats.join(',') + '&flags=${flags}&rum=${allowUserMonitoring ? 1 : 0}${ua}&callback=_nspolyfillComplete';
    cs(src, true, true);
  } else {
    _nspolyfillComplete();
  }

  function _nspolyfillComplete() {
    var scripts = [${scripts}];
    for (var i = 0; i < scripts.length; i++) {
      cs(scripts[i].src, scripts[i].async, false, scripts[i].nonce, scripts[i].id);
    }
  }
  `;
};
