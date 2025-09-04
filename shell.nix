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

  # build deps for this shell 
  inputsFrom = [];

  # commands to run upon entering nix shell environment
  shellHook = ''
    echo "Installing local bun packages...";
    bun install --silent;
    echo "Developer environment ready. Good luck out there o7";
  '';
}
