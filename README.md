# TBSP

NOTE: This repository is a W.I.P.

TBSP ("the big scum project"; preliminary name) is a webserver designed to host
ranked competitive games of Mafia.

## Installation & Setup

[See SETUP.md](./SETUP.md)

## Stack Architecture

All source code producing JavaScript output is written using TypeScript.
Software stack: Vue - Bun - Postgres

- Vue.js: frontend framework (Single-Page application)
- Bun: typescript backend runtime (incl. uWebSockets)
- PostgreSQL

## Monorepo Structure

This is a **monorepo** (a version-controlled repository containing
semantically-related but otherwise encapsulated workspaces). Workspaces are
designated either _applications_ or _libraries_:

- `./app`: Apps designed to be run in a specific environment.
  - `./app/server`: Server source code, reliant on the APIs provided by the Bun
    runtime and designed to be run in native TypeScript using Bun.
  - `./app/client`: Client source code, using the **vite** bundler to transpile
    source TypeScript code from `.ts` files and `.vue` single-file components to
    `client/dist`.

- `./lib`: JS libraries developed for usage by apps but which are designed to be
  modular and compatible with many different environments.
  - web: Implementations usable technically by any web development app, but
    designed specifically for TBSP.
  - mafia: Definitions and code relating to the game of Mafia, abstracted from
    the web app.
  - utils: Miscallaneous modular functions. _Eventually this should find a
    better home as it gets larger._

`./app` itself contains no configuration file, because the server and client are
largely dissimilar. `./lib` contains a `tsconfig.json` file serving as the base
for our JS libraries (which itself inherits from the root tsconfig).

# JavaScript Ecosystem and Module Resolution

All workspaces use the **ES Module** system. As a result, the library packages
(in `./lib`) provided here do not support CommonJS `require`, only dynamic
import. (Support could be added in future by emitting `.cjs` alternatives.)

Module specifiers (the string literals in import statements) should **include
`.ts` file extensions in all workspaces**. This is largely an arbitrary
decision. For more details, see below.

Imports within a workspace use relative paths (e.g.
`'../components/QueueButton.vue'`). Library packages can be imported as a
dependency (e.g. `'@tbsp/web/ws/client.ts'`)

- Imports between library packages are discouraged to avoid circular
  dependencies.

## Further details

As mentioned, the convention in all workspaces is to specify `.ts` extensions.
The reasoning for this is:

- In `app/`, module resolution occurs only via bundler rules (bundled client,
  Bun server). These support `.ts`, `.js`, and extensionless imports, and so the
  decision is arbitrary.
- In `lib/`, though we can import `.ts` in certain runtimes (like Bun), packages
  are designed to be standalone and should theoretically be publishable to NPM.
  This comes with certain compatibility rules:
  - JavaScript files (emitted from TypeScript transpilation) must be included in
    the package, along with separate type declarations.
  - JavaScript files must import with the `.js` extension.
  - TypeScript source code (and source maps) can also be included for
    convenience/DX.
  - When transpiling TypeScript to JavaScript, we can replace `.ts` extensions
    with `.js`, but cannot use extensionless imports without using a bundler.

The only limitation is that we cannot use extensionless imports in `./lib` - as
a result, the clearest convention seems to be using `.ts`.
