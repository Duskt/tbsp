# Installation & Setup

Currently, this project only depends on Bun (JavaScript runtime and toolkit). As such, manual installation is fairly easy:
- Follow the instructions at [[https://bun.com/get]]
- Clone this repository (``git clone https://github.com/duskt/tbsp``)
- In the repository, run ``bun install``, which will download local dependencies.
- Start the server with ``bun dev``.
(TODO: There might be an error on Windows about server/public or client/dist, because they're symlinked...) 

In future, we will also include PostgreSQL, and Windows will probably be intractable:
- TODO: Include Dockerfile.dev

# Architecture
This repository contains both server and client source code.

# Ecosystem
All source code producing JavaScript output is written using TypeScript.
Preliminary stack:
- Vue.js: frontend framework
- Bun: typescript backend runtime (incl. uWebSockets)
- Elysia backend framework
- [ ] Postgresql

Also uses:
- [ ] (to-del) vite: currently the bun builder cannot compile `.vue`; use esbuild ideally
- [ ] nix: root `shell.nix` developer environment (and bun runs locally in isolated mode) 
- [ ] (to-add) docker: alternative build reproducibility / complementary runtime reproducibility
