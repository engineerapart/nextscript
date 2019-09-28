import PropTypes from 'prop-types';
import React from 'react';
import terser from 'terser';

import { featureDetect } from './feature-detect';
import { htmlEscapeJsonString } from './htmlescape';
import { IDocumentComponentContext, IDocumentProps, NextScriptProps, ScriptEntry } from './interfaces';

export const CLIENT_STATIC_FILES_PATH = 'static';
export const CLIENT_STATIC_FILES_RUNTIME = 'runtime';
export const CLIENT_STATIC_FILES_RUNTIME_PATH = `${CLIENT_STATIC_FILES_PATH}/${CLIENT_STATIC_FILES_RUNTIME}`;
// static/runtime/amp.js
export const CLIENT_STATIC_FILES_RUNTIME_AMP = `${CLIENT_STATIC_FILES_RUNTIME_PATH}/amp.js`;
// static/runtime/webpack.js
export const CLIENT_STATIC_FILES_RUNTIME_WEBPACK = `${CLIENT_STATIC_FILES_RUNTIME_PATH}/webpack.js`;

// This components takes advantage of the fact that it is only ever rendered once.
export class NextScript extends React.Component<NextScriptProps> {

  public static contextTypes = {
    _documentProps: PropTypes.any,
    _devOnlyInvalidateCacheQueryString: PropTypes.string,
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

  public context!: IDocumentComponentContext;

  public getDynamicChunks(): ScriptEntry[] {
    const { dynamicImports, assetPrefix } = this.context._documentProps;
    const { _devOnlyInvalidateCacheQueryString } = this.context;

    return dynamicImports.map((bundle: { file: string }) => ({
      key: bundle.file,
      src: `${assetPrefix}/_next/${bundle.file}${_devOnlyInvalidateCacheQueryString}`,
      async: true,
      nonce: this.props.nonce,
      crossOrigin: this.props.crossOrigin || (process as any).crossOrigin,
    }));
  }

  public getScripts(): ScriptEntry[] {
    const { assetPrefix, files } = this.context._documentProps;
    if (!files || files.length === 0) {
      return [];
    }
    const { _devOnlyInvalidateCacheQueryString } = this.context;

    return files.map((file: string) => {
      // Only render .js files here
      if (!/\.js$/.exec(file)) {
        return null;
      }

      return {
        key: file,
        src: `${assetPrefix}/_next/${file}${_devOnlyInvalidateCacheQueryString}`,
        nonce: this.props.nonce,
        async: true,
        crossOrigin: this.props.crossOrigin || (process as any).crossOrigin,
      };
    }).filter(Boolean) as ScriptEntry[];
  }

  public static getInlineScriptSource(documentProps: IDocumentProps) {
    const { __NEXT_DATA__ } = documentProps;
    try {
      const data = JSON.stringify(__NEXT_DATA__);
      return htmlEscapeJsonString(data);
    } catch (err) {
      if (err.message.indexOf('circular structure')) {
        throw new Error(
          `Circular structure in "getInitialProps" result of page "${
          __NEXT_DATA__.page
          }". https://err.sh/zeit/next.js/circular-structure`,
        );
      }
      throw err;
    }
  }

  public getPageScripts() {
    const { staticMarkup, assetPrefix, __NEXT_DATA__ } = this.context._documentProps;
    const { _devOnlyInvalidateCacheQueryString } = this.context;
    const { page, buildId, dynamicBuildId } = __NEXT_DATA__;
    const crossOrigin = this.props.crossOrigin || (process as any).crossOrigin;

    const scripts: ScriptEntry[] = [];

    const appJsScript = assetPrefix +
      (dynamicBuildId
        ? `/_next/static/client/pages/_app.${buildId}.js`
        : `/_next/static/${buildId}/pages/_app.js`) +
      _devOnlyInvalidateCacheQueryString;

    const pageJsScript = assetPrefix +
      (dynamicBuildId
        ? `/_next/static/client/pages${getPageFile(page, buildId)}`
        : `/_next/static/${buildId}/pages${getPageFile(page)}`) +
      _devOnlyInvalidateCacheQueryString;

    // order matters.
    if (page !== '/_error') {
      scripts.push({ src: pageJsScript, async: true, nonce: this.props.nonce, id: `__NEXT_PAGE__${page}`, crossOrigin });
    }
    scripts.push({ src: appJsScript, async: true, nonce: this.props.nonce, id: `__NEXT_PAGE__/_app`, crossOrigin });

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
        crossOrigin: s.crossOrigin || undefined,
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
    const { staticMarkup, assetPrefix, amphtml, devFiles } = this.context._documentProps;
    const { _devOnlyInvalidateCacheQueryString } = this.context;
    const { nonce } = this.props;
    const crossOrigin = this.props.crossOrigin || (process as any).crossOrigin;

    const scripts = this.getPageScripts();
    const loaderScript = this.requiresPreloading()
      ? terser.minify(this.injectScripts(scripts)).code
      : null;

    if (amphtml) {
      if (process.env.NODE_ENV === 'production') {
        return null;
      }

      const ampDevFiles = [
        CLIENT_STATIC_FILES_RUNTIME_AMP,
        CLIENT_STATIC_FILES_RUNTIME_WEBPACK,
      ];

      return (
        <>
          {staticMarkup ? null : (
            <script
              id="__NEXT_DATA__"
              type="application/json"
              nonce={nonce}
              crossOrigin={crossOrigin}
              dangerouslySetInnerHTML={{
                __html: NextScript.getInlineScriptSource(
                  this.context._documentProps,
                ),
              }}
              data-amp-development-mode-only={true}
            />
          )}
          {ampDevFiles
            ? ampDevFiles.map((file) => (
              <script
                key={file}
                src={`${assetPrefix}/_next/${file}${_devOnlyInvalidateCacheQueryString}`}
                nonce={nonce}
                crossOrigin={crossOrigin}
                data-amp-development-mode-only={true}
              />
            ))
            : null}
        </>
      );
    }

    return (
      <React.Fragment>
        {devFiles
          ? devFiles.map((file: string) => (
            <script
              key={file}
              src={`${assetPrefix}/_next/${file}${_devOnlyInvalidateCacheQueryString}`}
              nonce={nonce}
              crossOrigin={crossOrigin}
            />
          ))
          : null}

        {staticMarkup ? null : (
          <script
            id="__NEXT_DATA__"
            type="application/json"
            nonce={nonce}
            crossOrigin={crossOrigin}
            dangerouslySetInnerHTML={{
              __html: NextScript.getInlineScriptSource(this.context._documentProps),
            }}
          />
        )}

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

function getPageFile(page: string, buildId?: string) {
  if (page === '/') {
    return buildId ? `/index.${buildId}.js` : '/index.js';
  }

  return buildId ? `${page}.${buildId}.js` : `${page}.js`;
}
