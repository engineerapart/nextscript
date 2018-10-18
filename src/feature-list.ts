export interface PolyfillDefinition {
  test: string | null;
  feature: string;
}

export const FeaturePolyfills = {
  /* These are the pre-configured groups offered by Polyfill.io */
  DEFAULT: {
    test: null,
    feature: 'default',
  },
  ES6: {
    test: null,
    feature: 'es6',
  },
  ES2015: {
    test: null,
    feature: 'es2015',
  },

  /* Full API of polyfills offered by Polyfill.io */
  FETCH: {
    test: `('fetch' in window)`,
    feature: 'fetch',
  },
  INTERSECTIONOBSERVER: {
    test: `('IntersectionObserver' in window)`,
    feature: 'IntersectionObserver',
  },
  CUSTOMEVENT: {
    test: `(typeof CustomEvent === 'function')`,
    feature: 'CustomEvent',
  },
  OBJECT_ASSIGN: {
    test: `('assign' in Object)`,
    feature: 'Object.assign',
  },
  ARRAY_FROM: {
    test: `('from' in Array)`,
    feature: 'Array.from',
  },
  ARRAY_FIND: {
    test: `('find' in Array.prototype)`,
    feature: 'Array.prototype.find',
  },
  ARRAY_FINDINDEX: {
    test: `('findIndex' in Array.prototype)`,
    feature: 'Array.prototype.findIndex',
  },
  ARRAY_FILL: {
    test: `('fill' in Array.prototype)`,
    feature: 'Array.prototype.fill',
  },
  ARRAY_INCLUDES: {
    test: `('includes' in Array.prototype)`,
    feature: 'Array.prototype.includes',
  },
  REQUESTANIMATIONFRAME: {
    test: `('requestAnimationFrame' in window)`,
    feature: 'requestAnimationFrame',
  },
  INTL: {
    test: `('Intl' in window)`,
    feature: 'Intl',
  },
};
