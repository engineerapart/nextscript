[![npm (scoped)](https://img.shields.io/npm/v/@engineerapart/nextscript.svg?style=for-the-badge)](https://www.npmjs.com/package/@engineerapart/nextscript)
[![npm](https://img.shields.io/npm/l/@engineerapart/nextscript.svg?style=for-the-badge)](https://www.npmjs.com/package/@engineerapart/nextscript)
![David](https://img.shields.io/david/engineerapart/nextscript.svg?style=for-the-badge)
![David](https://img.shields.io/david/dev/engineerapart/nextscript.svg?style=for-the-badge)

# Version Notice
* For Next <= v6, please use nextscript@~0.0.8
* For Next >= 7, please use nextscript@^1.0.0
* For Next 8 & 9, please use nextscript@^2.0.0
* For Next >= 9.0.3 and above, if using experimental module support for modern browsers, **this package is not needed** (see: [9.0.3 release notes](https://github.com/zeit/next.js/releases/tag/v9.0.3)). This is due to the fact that all polyfills offered by polyfill.io are already supported by modern browsers.

In each new version of Next there are incompatible changes with the prior versions. This component was always a stepping stone to a more permanent solution, which the Next.js team are now working on in the [Module/Nomodule RFC](https://github.com/zeit/next.js/issues/7563) and the [corresponding initial merge request](https://github.com/zeit/next.js/pull/7704) that went into Next.js 9.0.3.

Once that feature is enabled by default, this component will be deprecated.

# NextScript 💠

This project is not-so-cleverly named after the [export of the same name in the amazing Next.js framework](https://github.com/zeit/next.js/blob/canary/server/document.js#L126).

This component provides a flexible, business-rule oriented approach to loading the scripts in your Next project. By default, Next loads all scripts on page load, which may or may not be desirable behavior. Some of the reasons you may want to avoid that are:

- Performance: Only load these scripts when needed, or wait until the page load event (for things like _error, if you know it is not needed immediately)
- Preloading: It is not uncommon to need to run a script - or load a script from URL - before allowing your Next app to load.
- Polyfill preloading: This is the most common application of the previous point. Next bundles some polyfills, but only the ones NEXT requires - not the ones YOU require. If you require `IntersectionObserver` for example, it is on you to load it yourself. Since that is a HUGE polyfill (7kb minzipped!), you do not want to deliver it to all clients - only the ones that absolutely require it (IE <= 11, Safari ALL).

This NextScript component allows you to accomplish these goals and more in a flexible, minimal way. This component itself compiles down to 2.3kb minzipped (although it is only ever executed on the server!) and has a simple API.

Built originally out of the NextScript component itself, all of that functionality is supported, in addition to the features above.

## Motivation
Take a look at [this issue](https://github.com/zeit/next.js/issues/4636) on the Next.js repository. This is a common problem and sometimes it is not clear how to resolve it. This component gives you a seamless, drop-in way to handle polyfills that is performant and efficient, only delivering what is needed to each browser.

This component also retains **and expands** Next's support for nonces on script elements: Simply assign the `nonce` parameter and every script URL and every inline script will automatically get the nonce. This can be overridden on a per-script basis (can't imagine why you'd need to - but you can!).


## Opt-In
This component's functionality is opt-in. You can configure the component to behave exactly as NextScript itself does, or you can optionally enable the above features. Simply rendering `<NextScript />` will produce identical behavior to the component found in Next.

# Getting started
Install from npm:

```bash
npm i @engineerapart/nextscript

# or

yarn add @engineerapart/nextscript
```

You will find an entry in NPM under `nextscript`. This is our placeholder to avoid confusion with potential package collisions and is not the published package.


# Examples

#### Duplicate Next.js
The only difference between this example and the [default Next _document](https://github.com/zeit/next.js#custom-document) is where NextScript is imported from:

```js
import { NextScript } from '@engineerapart/nextscript';
import Document, { Head, Main } from 'next/document';

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <html>
        <Head>
          <style>{`body { margin: 0 } /* custom! */`}</style>
        </Head>
        <body className="custom_class">
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}
```

#### Preload polyfills
The canonical example: How to preload polyfills, including polyfills not defined by this project.

```js
import { NextScript, FeaturePolyfills } from '@engineerapart/nextscript';
import Document, { Head, Main } from 'next/document';

const features = [
  FeaturePolyfills.FETCH,
  FeaturePolyfills.CUSTOMEVENT,
  {
    test: `('entries' in Array.prototype)`,
    feature: 'Array.prototype.entries',
  },
];

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <html>
        <Head></Head>
        <body className="custom_class">
          <Main />
          <NextScript features={features} />
        </body>
      </html>
    );
  }
}
```


# Polyfill Service
Current this component points to the [Polyfill.io](https://polyfill.io) service, which serves ~150 million polyfill requests per DAY (4.5 billion/month!). However, eventually this project will also support pointing to your own self-hosted polyfill service, provided that it adheres to the Polyfill.io API (instructions for self-hosting the Polyfill.io service can be found [in their repository](https://github.com/Financial-Times/polyfill-service).)


# How it works
The default NextScript implementation captures the scripts generated by the Next build process and immediately renders them to `<script>` tags in its `render()` function.

This component takes a different approach: It collects the same script information from the build that the original Next component does, but instead of immediately rendering them, it inserts the script information into a preloader script. This provides the opportunity to:

1. Load something else first
2. Load something else *after*
3. Load them on command

After you've configured the component, it will execute your configurations inside the preloader, and then execute the Next scripts. If you don't configure the component, it does exactly the same thing that the original Next component does!


# API

You can configure the component to behave exactly as NextScript itself does, or you can optionally enable the above features. Simply rendering `<NextScript />` will produce identical behavior to the component found in Next.

## `NextScript` Properties

If you are using Typescript, TS will automatically detect the typings, included with this project, and provide intellisense if you are using a TS-aware editor. These properties are also documented here.

All properties are optional. Rendering this component as `<NextScript />` simply duplicates exactly what the NextScript component included with Next does.

| Prop	| Type  | Default	| Description  	|
|---	|---	|---	|---	|
| nonce  	| string | undefined	| Nonce to apply to all scripts loaded via this component 	|
| allowUserMonitoring  	| boolean | true	| Sends the `rum` URL parameter to the Polyfill service 	|
| minify  	| boolean | true	| Instructs the Polyfill service to send minified polyfills 	|
| preLoadScripts  	| ScriptEntry[] | []	| Scripts to load *before* the Next scripts 	|
| postLoadScripts  	| ScriptEntry[] | []	| Scripts to load *after* the Next scripts 	|
| useFeatureDetection  	| boolean | true	| Detect features in user's browser instead of letting the Polyfill service use the UA	|
| features  	| PolyfillDefinition[] | []	| The list of required features, selected from the FeaturePolyfills enum, or objects you defined yourself if not included in this project (feel free to PR!) 	|
| preloadPolyfills  	| boolean | true	| Flag to indicate whether the component will preload polyfills. If false, `features` and `useFeatureDetection` will be ignored.	|


### `ScriptEntry` Interface
Defined in Typescript, this interface consists of the following fields:

| Field	| Type  | Default	| Description  	|
|---	|---	|---	|---	|
| src  	| string | [required]	| The script source to load. For now, only URL sources are supported.	|
| nonce  	| string | undefined	| The nonce to use for this script. If not supplied, the NextScript nonce will be used, or undefined if none are provided.	|
| id  	| string | undefined	| An ID to identify this script node.	|
| async  	| boolean | false	| Whether the `async` flag should be applied to this script node.	|

If you need to load arbitrary scripts, you can mount a script node before this element in your Next project. It's on our list to support, so it is coming!


### `PolyfillDefinition` Interface
This project supplies a small collection of default polyfill definitions to get you started, but does not currently support all [**194** polyfills supported by Polyfill.io](https://polyfill.io/v2/docs/features/)! Thus, it was important to be able to allow you to define arbitrary polyfills. This is accomplished by providing an array of PolyfillDefinition objects to the `features` prop of `NextScript`.

Defined in Typescript, this interface consists of the following fields:

| Field	| Type  | Default	| Description  	|
|---	|---	|---	|---	|
| test  	| string | null	| The test, as a string, the browser must run. For example `'('fetch' in window)'`. This should not be null unless you are providing a Polyfill.io category (default, es6); however these are already configured in this project. If null, no test will be made, and the `feature` value injected directly into the feature list sent to the Polyfill service	|
| feature  	| string | [required]	| The Feature ID known by the Polyfill service. A full list can be found at [Polyfill.io](https://polyfill.io/v2/docs/features/)	|

# TODO
1. Support a self-hosted Polyfill service
2. Add all known polyfills to the `FeaturePolyfills` collection
3. Support inline scripts to be injected in the preloader

# Contributing
PRs are welcome. Make sure to read our contribution guidelines and code of conduct.

# License
MIT
