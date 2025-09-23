# TBSP

NOTE: This repository is a W.I.P.

TBSP ("the big scum project"; preliminary name) is a webserver designed to host
ranked competitive games of Mafia.

## Installation & Setup

[See SETUP.md](./SETUP.md)

## Ecosystem

All source code producing JavaScript output is written using TypeScript.
Software stack:

- Vue.js: frontend framework (Single-Page application)
- Bun: typescript backend runtime (incl. uWebSockets)
- Elysia backend framework
- PostgreSQL

## Architecture

This repository contains three `src` directories:

- `./src`: Server/client agnostic code, mostly types
- `server/src`: server source code: HTTP/ws handlers, database interface, login
- `client/src`: frontend interface
