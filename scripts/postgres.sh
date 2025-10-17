# make shell stricter
set -euf

if [ "$*" != "" ]; then
	# in cases where the new shell created by 'su postgres' does not have
	# the dependencies / local environment variable, pass them in
	# through script arguments :)
	PATH="$1"
	PGDATA="$2"
	ORIGINAL_USER="$3"
else
	ORIGINAL_USER="$USER"
fi

err() {
	echo "Error: $*" >&2 && exit 1
}

check_deps() {
	for d in "$@"; do
		# echo "Asserting $d is installed..."
		command -v "$d" >/dev/null 2>&1 || {
			err "Dependency $d must be installed to run this program."
		}
	done
}

# get yes / no input from user; returns via exit code
prompt_yn() {
	read -r REPLY
	REPLY=$(echo "$REPLY" | tr "[:lower:]" "[:upper:]" | cut -c 1)
	test "$REPLY" = "Y"
}

find_default_pgroot_directory() {
	if [ "${PGROOT+''}" != "" ]; then
		echo "Using environment variable PGROOT=$PGROOT"
		return
	fi
	if test -d "/var/lib/pgsql"; then
		echo "Found pre-existing postgres directory '/var/lib/pgsql'. Using this as PGROOT."
		export PGROOT=/var/lib/pgsql
	else
		if [ "${PGDATA+''}" != "" ]; then
			PGROOT=$(realpath "$PGDATA/..")
			export PGROOT
			return
		fi
		echo "I need to know where postgres setup files should go."
		printf "Would you like to use the default location '/var/lib/pgsql' (Y/N):"
		if prompt_yn; then
			export PGROOT=/var/lib/pgsql
		else
			echo "In that case, please provide environment variable 'PGROOT'." && exit 1
		fi
	fi
}

find_default_pgdata_directory() {
	if [ "${PGDATA+''}" != "" ]; then
		echo "Using environment variable PGDATA=$PGDATA"
		return
	fi
	if test -d "$PGROOT/data"; then
		echo "Found pre-existing database cluster at $PGROOT/data. Using this as PGDATA."
	fi
	export PGDATA=/var/lib/pgsql/data
}

setup_environment() {
	echo "Checking dependencies..."
	# PGROOT (postgres system user home directory)
	# PGDATA (postgres database cluster, where the daemon lives)
	# PGSOCKETS = "/run/postgresql";
	# TBSP_DBNAME = "tbsp";
	check_deps "postgres" "initdb"
	find_default_pgroot_directory
	find_default_pgdata_directory
	if [ "${PGSOCKETS+''}" = "" ]; then
		export PGSOCKETS="/run/postgresql"
	fi
	if [ "${TBSP_DBNAME+''}" = "" ]; then
		export TBSP_DBNAME="tbsp"
	fi
}

create_postgres_system_user() {
	if id postgres &>/dev/null; then
		echo "Found system user 'postgres'"
		return
	fi
	echo "Creating a new password-less system user 'postgres'."
	if which useradd &>/dev/null; then
		useradd --system --no-create-home --group postgres postgres
		return
	fi
	if which adduser &>/dev/null; then
		adduser --system --no-create-home --group postgres postgres
		return
	fi
	"couldnt find any command to make a new user: i look for useradd and adduser" && exit 1
}

check_postgres_owns_dir() {
	for d in "$@"; do
		if [ "$(stat -c "%U" "$d")" != "postgres" ]; then
			err "user postgres does not own $d"
		fi
		if [ "$(stat -c "%G" "$d")" != "postgres" ]; then
			err "group postgres does not own $d"
		fi
		echo "Correct: $d is owned by postgres."
	done
}

create_postgres_directories() {
	# if they already exist, check the permissions
	if [ -d "$PGROOT" ]; then
		check_postgres_owns_dir "$PGROOT"
	else
		err "mkdir $PGROOT"
	fi
	if [ -d "$PGDATA" ]; then
		check_postgres_owns_dir "$PGDATA"
	else
		err mkdir
	fi
}

init_postgres_database_cluster() {
	ensure_postgres_is_user
	if [ "$(ls -A "$PGDATA")" != "" ]; then
		echo "$PGDATA contains files, so not initialising a new cluster."
		return
	fi
	initdb -D "$PGDATA"
}

start_postgres_daemon() {
	if pgrep postgres &>/dev/null; then
		echo "Found postgres daemon already running."
		return
	fi
	ensure_postgres_is_user
	# must run as user postgres
	# setup_environment guarantees these executables exist
	echo "Starting up the postgres daemon in the background."
	pg_ctl -D "$PGDATA" start
}

ensure_postgres_is_user() {
	read -r OUTPUT < <(id -un)
	if [ "$OUTPUT" != "postgres" ]; then
		echo "The rest of this script needs to be run as postgres."
		printf "Switch user for the remainder of the script? (Y/N): "
		if prompt_yn; then
			if [ "$OUTPUT" != "root" ]; then
				echo "Switching user to postgres requires sudo."
				sudo su postgres -c "./scripts/postgres.sh $PATH $PGDATA $USER"
			else
				su postgres -c "./scripts/postgres.sh $PATH $PGDATA $USER"
			fi
			exit 0
		else
			echo "Did not switch user."
			err "Please run the rest of this script as user 'postgres'. Only the root user can log in as postgres, so you will have to do 'sudo su postgres -c PATH_TO_THIS_SCRIPT'."
		fi
	fi
}

setup_postgres_user_db() {
	if [ "$ORIGINAL_USER" = "postgres" ]; then
		printf "Please enter your day-to-day system username, which you use for development (e.g. johnsmith): "
		read -r ORIGINAL_USER
	fi
	read -r OUTPUT < <(psql postgres -tXAc "SELECT rolcreatedb, rolcanlogin, rolconnlimit, rolpassword FROM pg_authid WHERE rolname='$ORIGINAL_USER'")
	if [ "$OUTPUT" != "t|t|-1|" ]; then
		err "The postgres user role '$ORIGINAL_USER' exists but differs from the expected configuration."
		printf "Drop user role and recreate? (Y/N): "
		if prompt_yn; then
			dropuser "$ORIGINAL_USER"
			createuser --createdb "$ORIGINAL_USER"
		else
			echo "Continuing anyways, but this may cause issues."
		fi
	else
		echo "Found postgres user role '$ORIGINAL_USER', which is set up as expected."
	fi
	psql postgres -tXAc "SELECT 1 FROM pg_database WHERE datname='$TBSP_DBNAME'" | grep -q 1 || "$(which createdb)" "$TBSP_DBNAME"
}

## INSTRUCTIONS

setup_environment              # find directories, set env vars
create_postgres_system_user    # find/create
create_postgres_directories    # ensure permissions set up correctly, mkdir
init_postgres_database_cluster # check / run initdb
start_postgres_daemon          # find process / start daemon
setup_postgres_user_db         # find user role / create, find db / create

echo ""
echo "Success! Everything should be set up correctly!"
