import { ComponentType } from 'react';

// These come from external dependencies and we don't want to import them here.
type ServerResponse = any;
type IncomingMessage = any;
type ParsedUrlQuery = any;

export interface ScriptEntry {
  src: string;
  nonce?: string;
  id?: string;
  async?: boolean;
  crossOrigin?: string;
}

export interface FeatureDetectProps {
  scripts: string;
  allowUserMonitoring?: boolean;
  minify?: boolean;
  useFeatureDetection?: boolean;
  features?: PolyfillDefinition[];
}

export interface IAppContext<R extends IRouterInterface = IRouterInterface> {
  Component: NextComponentType<IContext>;
  router: R;
  ctx: IContext;
}

export interface IAppInitialProps {
  pageProps: any;
}

export interface IRouterInterface {
  route: string;
  pathname: string;
  query: string;
  asPath: string;
}

export interface IAppProps<R extends IRouterInterface = IRouterInterface> extends IAppInitialProps {
  Component: NextComponentType<IContext>;
  router: R;
}

export type Enhancer<C> = (Component: C) => C;
export type AppType = NextComponentType<IAppContext, IAppInitialProps, IAppProps>;
export type NextComponentType<C extends IBaseContext = any, P = any, CP = {}> = ComponentType<CP> & {
  getInitialProps?(context: C): Promise<P>,
};

export type ComponentsEnhancer =
  | { enhanceApp?: Enhancer<AppType>; enhanceComponent?: Enhancer<NextComponentType> }
  | Enhancer<NextComponentType>;

export interface RenderPageResult { html: string; head?: Array<JSX.Element | null>; dataOnly?: true; }

export type RenderPage = (options?: ComponentsEnhancer) => RenderPageResult | Promise<RenderPageResult>;

export interface IBaseContext {
  res?: ServerResponse;
  [k: string]: any;
}

export interface IContext {
  err?: Error & { statusCode?: number } | null;
  req?: IncomingMessage;
  res?: ServerResponse;
  pathname: string;
  query: ParsedUrlQuery;
  asPath?: string;
}

export interface IDocumentContext extends IContext {
  renderPage: RenderPage;
}

export interface IDocumentInitialProps extends RenderPageResult {
  styles?: Array<React.ReactElement<any>>;
}

export interface INEXTDATA {
  dataManager: string;
  props: any;
  page: string;
  query: ParsedUrlQuery;
  buildId: string;
  dynamicBuildId: boolean;
  assetPrefix?: string;
  runtimeConfig?: { [key: string]: any };
  nextExport?: boolean;
  dynamicIds?: string[];
  err?: Error & { statusCode?: number };
}

export interface ManifestItem {
  id: number | string;
  name: string;
  file: string;
  publicPath: string;
}

export interface IDocumentProps extends IDocumentInitialProps {
  __NEXT_DATA__: INEXTDATA;
  dangerousAsPath: string;
  ampPath: string;
  amphtml: boolean;
  hasAmp: boolean;
  staticMarkup: boolean;
  devFiles: string[];
  files: string[];
  dynamicImports: ManifestItem[];
  assetPrefix?: string;
}

export interface IDocumentComponentContext {
  readonly _documentProps: IDocumentProps;
  readonly _devOnlyInvalidateCacheQueryString: string;
}

export interface PolyfillDefinition {
  test: string | null;
  feature: string;
}

export interface NextScriptProps {
  /**
   * Nonce to apply to all scripts loaded via this component: ['']
   */
  nonce?: string;
  /**
   * Whether to allow crossOrigin on the injected scripts: ['']
   */
  crossOrigin?: string;
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
