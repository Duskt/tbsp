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
