# Create a development environment (all necessary commands installed and on PATH) for using both the client and the server (all you need for the server is bun right now).
let
  pkgs = import (fetchTarball "https://github.com/NixOS/nixpkgs/archive/nixos-25.05.tar.gz") {};
in pkgs.mkShell {

  name = "tbsp-nix-shell";
  
  # bun implements an npm-like local package manager which we use for most things
  # we use its 'isolated install mode' for deterministic CLI dependencies
  packages = with pkgs; [
    bun 
    nodejs_24 # optional (suppress warning): Vite complains that Bun's NodeJS version is old
    postgresql
  ];

  # build deps for this shell ??
  buildInputs = [];
  # inherit the build dependencies from another package 
  inputsFrom = [];

  PGROOT = "/home/postgres";
  PGDATA = "/home/postgres/tbsp-db";
  # commands to run upon entering nix shell environment
  # territory of the postgresql daemon...
  shellHook = ''
    echo "Installing local bun packages...";
    bun install --silent;

    echo "Setting up PostgreSQL. I will need privileged access in order to use the system user 'postgres'.";

    # setup system user. i don't check if user is present but incorrectly setup
    if test ! id postgres &>/dev/null; then # if postgres user is missing
	    if id -g postgres &>/dev/null; then # if postgres group is present 
		    sudo useradd --system --no-create-home --group postgres postgres;
	    else
		    sudo useradd --system --no-create-home --user-group postgres;
	    fi

    # initdb and start daemon
    # unquoted heredoc: substitute all variables before switching user.
    # this includes all the $(which ...) commands, replaced with their absolute path
    sudo su postgres -c "$SHELL" <<EOF 
	    cd $PGROOT;
	    if [ ! -d $PGDATA ]; then $(which initdb) -D $PGDATA; fi
	    $(which pg_ctl) -D $PGDATA -o "--unix-socket-directories=$PGROOT" start
EOF
    # stop daemon upon exiting shell
    trap 'sudo su postgres -c "$(which pg_ctl) -D $PGDATA stop"' EXIT;
    echo "Developer environment ready. Good luck out there o7";
  '';
}
