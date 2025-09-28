# Setup Guide

## Installation

This project depends on [Bun](https://bun.com/get) (JS runtime) and
[PostgreSQL](https://www.postgresql.org/download/) (Database management). Listed
below are different options for installing these dependencies on different
operating systems:

- **Windows**: [**Using Docker**](#Docker); [Manual install](#Manual) (Docker
  recommended)
- **macOS**: [**Using homebrew**](#Homebrew); [Using nix](#Nix);
  [Manual install](#Manual) (Homebrew recommended)
- **Linux**: [Using nix](#Nix); [Using homebrew](#Homebrew);
  [Manual install](#Manual); (All are good)

Then, follow the [Setup guide](#Setup).

### Nix

If using Nix, you don't need to install any dependencies yourself. Skip straight
to cloning the repository, and then use `nix-shell` to install all dependencies
into the environment and set up Postgres.

This creates a developer environment which you should `exit` once finished
(closing the postgres daemon).

### Manual

The dependencies are linked below: (Note: On Windows, this setup has not been
tested; please leave an issue or contact maintainers for help.)

- [Bun](https://bun.com/get) (JS runtime)
- [PostgreSQL](https://www.postgresql.org/download/) (Database management)

Follow the documentation on the websites. To check if they have worked:

```sh
$ bun --version
1.2.13
$ postgres --version
postgres (PostgreSQL) 17.6

# You can also use this command to check Postgres was properly setup: it should output a table with a few rows
$ psql postgres -AXc "SELECT * FROM pg_database"
```

### Docker

The development image (`Dockerfile.dev`) is a minimal docker setup with Postgres
and Bun which can run the server.

- `docker build --file Dockerfile.dev --tag tbsp-dev .` (Build from
  Dockerfile.dev under the name 'tbsp-dev')
- `docker run -it -p 9001:9001 tbsp-dev` (Run an interactive terminal with port
  9001 forwarded to host)

(Remember to `docker container prune` and `docker rmi tbsp-dev` when you want to
clean up.

### Homebrew

Homebrew provides a convenient installation process from the CLI. These commands
are taken from the download pages (linked at the top): you should check they are
not outdated before using.

- [Bun](https://bun.com/get) (JS runtime)
  - `brew tap oven-sh/bun`
  - `brew install bun`
- [PostgreSQL](https://www.postgresql.org/download/) (Database management)
  - `brew install postgresql@17`
  - Follow the instructions in the output to set up Postgres.

## Setup

Create a database: (You must be logged in as your default user - the one which
will run the project.)

```sh
createdb TBSP
```

If this errors, Postgres is not installed entirely. The Postgres installation
should have set up:

- A database cluster (check if `psql postgres -AXc "SELECT * FROM pg_database"`
  errors)
- A role for your user (check if `psql postgres` errors)

Once you have installed the dependencies and set up postgres, you should be able
to run the webserver for development.

- Clone this repository into a directory
  (`git clone https://github.com/duskt/tbsp ./DEST`) and enter (`cd DEST`)
- In the repository, run `bun install`, which will download local dependencies.
- Start the server with `bun dev`.
