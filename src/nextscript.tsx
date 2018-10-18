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

  public static defaultProps: NextScriptProps = {
    allowUserMonitoring: true,
    minify: true,
    preLoadScripts: [],
    postLoadScripts: [],
    useFeatureDetection: true,
    features: [],
    preloadPolyfills: true,
  };

  public getDynamicChunks(): ScriptEntry[] {
    const { dynamicImports, assetPrefix } = this.context._documentProps;
    return dynamicImports.map((bundle: { file: string }) => ({
      key: bundle.file,
      src: `${assetPrefix}/_next/${bundle.file}`,
      async: true,
      nonce: this.props.nonce,
    }));
  }

  public getScripts(): ScriptEntry[] {
    const { assetPrefix, files } = this.context._documentProps;
    if (!files || files.length === 0) {
      return [];
    }

    return files.map((file: string) => {
      // Only render .js files here
      if (!/\.js$/.exec(file)) {
        return null;
      }

      return {
        key: file,
        src: `${assetPrefix}/_next/${file}`,
        nonce: this.props.nonce,
        async: true,
      };
    }).filter(Boolean) as ScriptEntry[];
  }

  public static getInlineScriptSource(documentProps: any) {
    const { __NEXT_DATA__ } = documentProps;
    // const { page } = __NEXT_DATA__;
    // tslint:disable-next-line
    return `__NEXT_DATA__ = ${htmlescape(__NEXT_DATA__)};__NEXT_LOADED_PAGES__=[];__NEXT_REGISTER_PAGE=function(r,f){__NEXT_LOADED_PAGES__.push([r, f])}`
  }

  public getPageScripts() {
    const { staticMarkup, assetPrefix, __NEXT_DATA__ } = this.context._documentProps;
    const { page, buildId } = __NEXT_DATA__;

    const scripts: ScriptEntry[] = [];
    const pagePathname = getPagePathname(page);
    const appJsScript = `${assetPrefix}/_next/static/${buildId}/pages/_app.js`;
    const errorJsScript = `${assetPrefix}/_next/static/${buildId}/pages/_error.js`;
    const pageJsScript = `${assetPrefix}/_next/static/${buildId}/pages${pagePathname}`;

    // order matters.
    if (page !== '/_error') {
      scripts.push({ src: pageJsScript, async: true, nonce: this.props.nonce, id: `__NEXT_PAGE__${page}` });
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
    const { staticMarkup, assetPrefix, devFiles } = this.context._documentProps;
    const { nonce } = this.props;
    const scripts = this.getPageScripts();
    const loaderScript = this.requiresPreloading()
      ? terser.minify(this.injectScripts(scripts)).code
      : null;

    return (
      <React.Fragment>
        {devFiles ? devFiles.map((file: string) => <script key={file} src={`${assetPrefix}/_next/${file}`} nonce={nonce} />) : null}
        {staticMarkup
          ? null
          : <script id="__next-data" nonce={nonce} dangerouslySetInnerHTML={{ __html: NextScript.getInlineScriptSource(this.context._documentProps) }} />}

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

function getPagePathname(page: string) {
  if (page === '/') {
    return '/index.js';
  }

  return `${page}.js`;
}
