import htmlescape from 'htmlescape';
import PropTypes from 'prop-types';
import React from 'react';
import terser from 'terser';
import { featureDetect, ScriptEntry } from './feature-detect';
import { PolyfillDefinition } from './feature-list';

export interface NextScriptProps {
  /**
   * Nonce to apply to all scripts loaded via this component: ['']
   */
  nonce?: string;
  /**
   * Sends the `rum` URL parameter to the Polyfill service.: [true]
   */
  allowUserMonitoring?: boolean;
  /**
   * Instructs the Polyfill service to send minified polyfills : [true]
   */
  minify?: boolean;
  /**
   * Scripts to load *before* the Next scripts: []
   */
  preLoadScripts?: ScriptEntry[];
  /**
   * Scripts to load *after* the Next scripts: []
   */
  postLoadScripts?: ScriptEntry[];
  /**
   * Detect features in user's browser instead of letting the Polyfill service use the UA: [true]
   */
  useFeatureDetection?: boolean;
  /**
   * The list of required features, selected from the FeaturePolyfills enum.
   * Only the features requiring polyfill in the target browser will be downloaded
   * Default is empty.
   */
  features?: PolyfillDefinition[];
  /**
   * Flag to indicate whether the component will preload polyfills. [true].
   * If false, `features` and `useFeatureDetection` will be ignored.
   */
  preloadPolyfills?: boolean;
}

// This components takes advantage of the fact that it is only ever rendered once.
export class NextScript extends React.Component<NextScriptProps> {

  public static contextTypes = {
    _documentProps: PropTypes.any,
  };

  public static defaultProps = {
    allowUserMonitoring: true,
    minify: true,
    preLoadScripts: [],
    postLoadScripts: [],
    useFeatureDetection: true,
    features: [],
    preloadPolyfills: true,
  };

  public getChunkScript(filename: string, additionalProps: any = {}): ScriptEntry[] {
    const { __NEXT_DATA__, buildManifest } = this.context._documentProps;
    const { assetPrefix } = __NEXT_DATA__; // , buildId

    const files = buildManifest[filename];

    return files.map((file: string) => ({
      src: `${assetPrefix}/_next/${file}`,
      nonce: this.props.nonce,
      async: additionalProps.async,
    }));
  }

  public getScripts() {
    const { dev } = this.context._documentProps;
    if (dev) {
      return [
        ...this.getChunkScript('manifest.js'),
        ...this.getChunkScript('main.js'),
      ];
    }

    // In the production mode, we have a single asset with all the JS content.
    // So, we can load the script with async
    return [...this.getChunkScript('main.js', { async: true })];
  }

  public getDynamicChunks(): ScriptEntry[] {
    const { chunks, __NEXT_DATA__ } = this.context._documentProps;
    const { assetPrefix } = __NEXT_DATA__;

    return chunks.filenames.map((chunk: string) => ({
      src: `${assetPrefix}/_next/webpack/chunks/${chunk}`,
      nonce: this.props.nonce,
      async: true,
    }));
  }

  public getNextDataScript() {
    const { __NEXT_DATA__, chunks } = this.context._documentProps;
    const { page, pathname } = __NEXT_DATA__;
    __NEXT_DATA__.chunks = chunks.names;

    return `
      __NEXT_DATA__ = ${htmlescape(__NEXT_DATA__)}
      module={}
      __NEXT_LOADED_PAGES__ = []
      __NEXT_LOADED_CHUNKS__ = []
      __NEXT_REGISTER_PAGE = function (route, fn) {
        __NEXT_LOADED_PAGES__.push({ route: route, fn: fn })
      }
      __NEXT_REGISTER_CHUNK = function (chunkName, fn) {
        __NEXT_LOADED_CHUNKS__.push({ chunkName: chunkName, fn: fn })
      }
      ${page === '_error' && `
      __NEXT_REGISTER_PAGE(${htmlescape(pathname)}, function() {
          var error = new Error('Page does not exist: ${htmlescape(pathname)}')
          error.statusCode = 404
          return { error: error }
        })
      `}
    `;
  }

  public getPageScripts() {
    const { staticMarkup, __NEXT_DATA__ } = this.context._documentProps;
    const { page, pathname, buildId, assetPrefix } = __NEXT_DATA__;

    const scripts: ScriptEntry[] = [];
    const pagePathname = getPagePathname(pathname);
    const appJsScript = `${assetPrefix}/_next/${buildId}/page/_app.js`;
    const errorJsScript = `${assetPrefix}/_next/${buildId}/page/_error.js`;
    const pageJsScript = `${assetPrefix}/_next/${buildId}/page${pagePathname}`;

    // order matters.
    if (page !== '/_error') {
      scripts.push({ src: pageJsScript, async: true, nonce: this.props.nonce, id: `__NEXT_PAGE__${pathname}` });
    }
    scripts.push({ src: appJsScript, async: true, nonce: this.props.nonce, id: `__NEXT_PAGE__/_app` });
    scripts.push({ src: errorJsScript, async: true, nonce: this.props.nonce, id: `__NEXT_PAGE__/_error` });

    if (!staticMarkup) {
      // order matters.
      scripts.push(...this.getDynamicChunks());
      scripts.push(...this.getScripts());
    }

    return scripts;
  }

  public injectScripts(scripts: ScriptEntry[]) {
    const { nonce, allowUserMonitoring, minify, useFeatureDetection, features, preLoadScripts, postLoadScripts } = this.props;

    const mapSerialize = (s: ScriptEntry) => {
      // const src = `src: '${s.src}'`;
      // const isAsync = s.async ? `async: ${s.async}` : undefined;
      // const nonce = s.nonce ? `nonce: '${s.nonce}'` : undefined;
      // const id = s.id ? `id: '${s.id}'` : undefined;
      // return `{ ${[src, async: isAsync, nonce, id].filter(Boolean).join(', ')} }`;
      const entry = {
        src: s.src,
        async: s.async || undefined,
        nonce: s.nonce || nonce || undefined,
        id: s.id || undefined,
      };
      return JSON.stringify(entry);
    };

    const scriptsEntries: string[] = [
      ...(preLoadScripts || []).map(mapSerialize),
      ...scripts.map(mapSerialize),
      ...(postLoadScripts || []).map(mapSerialize),
    ];

    return featureDetect({
      scripts: `\n${scriptsEntries.join(',\n')}\n`,
      allowUserMonitoring,
      minify,
      useFeatureDetection,
      features,
    });
  }

  private requiresPreloading() {
    const { useFeatureDetection, features, preloadPolyfills } = this.props;
    return preloadPolyfills
      && (useFeatureDetection || (Array.isArray(features) && features.length > 0));
    // || (Array.isArray(preLoadScripts) && preLoadScripts.length > 0);
  }

  public render() {
    const { staticMarkup } = this.context._documentProps;
    const { nonce } = this.props;
    const scripts = this.getPageScripts();
    const loaderScript = this.requiresPreloading()
      ? terser.minify(this.injectScripts(scripts)).code
      : null;

    return (
      <React.Fragment>
        {staticMarkup
          ? null
          : <script id="__next-data" nonce={nonce} dangerouslySetInnerHTML={{ __html: this.getNextDataScript() }} />}

        {loaderScript && <script id="__next-preloader" nonce={nonce} dangerouslySetInnerHTML={{ __html: loaderScript }} />}

        {!loaderScript && scripts.map((s, index) => {
          const scriptProps = {
            src: s.src,
            async: s.async || undefined,
            nonce: s.nonce || nonce || undefined,
            id: s.id || undefined,
          };
          return <script {...scriptProps} key={index} />;
        })}
      </React.Fragment>
    );
  }
}

function getPagePathname(pathname: string) {
  if (pathname === '/') {
    return '/index.js';
  }

  return `${pathname}.js`;
}
