# Create a development environment (all necessary commands installed and on PATH) for using both the client and the server (all you need for the server is bun right now).
let
  # too many root-level config files for a flake.nix & .lock file.
  pkgs = import (fetchTarball {
    url = "http://github.com/NixOS/nixpkgs/archive/8eaee110344796db060382e15d3af0a9fc396e0e.tar.gz"; # nixos-unstable as of this commit
    sha256 = "1k5zyljqg8fp99hzgjkvkawhmbwlfsnz4viisfcfdjyky9zrc8c8";
  }) { };
in
pkgs.mkShell {

  name = "tbsp-nix-shell";

  # bun implements an npm-like local package manager which we use for most things
  # we use its 'isolated install mode' for deterministic CLI dependencies
  packages = with pkgs; [
    bun # 1.2.22
    prettier
    postgresql
  ];

  # build deps for this shell ??
  buildInputs = [ ];
  # inherit the build dependencies from another package
  inputsFrom = [ ];

  PGROOT = "/home/postgres";
  PGDATA = "/home/postgres/tbsp-db";
  PGSOCKETS = "/run/postgresql"; # /run is a tmpfs (held in memory) for program runtime state, so this shouldn't be littering
  TBSP_DBNAME = "TBSP";
  # commands to run upon entering nix shell environment
  # territory of the postgresql daemon...
  shellHook = ''
        echo "Setting up PostgreSQL. I will need privileged access in order to use the system user 'postgres'.";
        # setup system user. i don't check if user is present but incorrectly setup
        if test ! id postgres &>/dev/null; then # if postgres user is missing
    	    if id -g postgres &>/dev/null; then # if postgres group is present 
    		    sudo useradd --system --no-create-home --group postgres postgres;
    	    else
    		    sudo useradd --system --no-create-home --user-group postgres;
    	    fi
        fi
        
        sudo mkdir -p $PGROOT;
        sudo chown postgres $PGROOT;
        sudo chgrp postgres $PGROOT;
        sudo mkdir -p $PGSOCKETS;
        sudo chown postgres $PGSOCKETS;
        sudo chgrp postgres $PGSOCKETS;
        # initdb and start daemon
        # unquoted heredoc: substitute all variables before switching user.
        # this includes all the $(which ...) commands, replaced with their absolute path
        # Creates POSTGRESQL user if one doesn't exist (https://stackoverflow.com/a/8546783)
        sudo su postgres -c "$SHELL" <<EOF 
    	    cd $PGROOT;
    	    echo 'Setting up database at $PGDATA...';
    	    if [ ! -d $PGDATA ]; then $(which initdb) -D $PGDATA &>/dev/null; fi
    	    $(which pg_ctl) -D $PGDATA start &>/dev/null;
    	    if [ \$? -eq 0 ]; then echo 'Started postgres daemon (background program).'; else echo 'ERROR: Postgres server failed to start.'; fi
    	    $(which psql) postgres -tXAc "SELECT 1 FROM pg_roles WHERE rolname='$USER'" | grep -q 1 || $(which createuser) --createdb $USER;
    	    $(which psql) postgres -tXAc "SELECT 1 FROM pg_database WHERE datname='$TBSP_DBNAME'" | grep -q 1 || $(which createdb) $TBSP_DBNAME; 
    EOF
        # stop daemon upon exiting shell
        trap 'echo Stopping server...; sudo su postgres -c "$(which pg_ctl) -D $PGDATA stop"' EXIT;

        echo "Installing local bun packages...";
        bun install --silent;

        echo "Developer environment ready. Good luck out there o7";
  '';
}
