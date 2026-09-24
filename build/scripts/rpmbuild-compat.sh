#!/bin/bash
# rpmbuild-compat.sh
#
# Compatibility wrapper for rpmbuild to fix the fpm 1.9.3 + rpm 6.x incompatibility.
#
# Problem:
#   rpm 6.x introduced a new %mkbuilddir phase that runs *before* %install.
#   %mkbuilddir does: rm -rf %{buildroot} && mkdir -p %{buildroot}
#   fpm 1.9.3 stages files directly into BUILD/ (passed as --define buildroot ...)
#   and generates a spec with '%install\n# noop', expecting the staged files to already
#   be present in the buildroot. But %mkbuilddir deletes them first, so rpm finds nothing.
#
# Fix:
#   1. Hard-link all staged files from BUILD/ into a safe directory outside of BUILD/
#      (this must happen before rpmbuild runs, so before %mkbuilddir can wipe them).
#   2. Patch the spec's %install section to restore the files into %{buildroot} after
#      %mkbuilddir has created a fresh empty buildroot.
#   Hard links are used so the operation is near-instant and uses no extra disk space.
#
# This wrapper is automatically installed into a temp PATH directory by build.mjs on Linux.

set -e

WRAPPER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Find the real rpmbuild, excluding this wrapper's directory ────────────────
REAL_RPMBUILD=""
while IFS= read -r dir; do
    [ "$dir" = "$WRAPPER_DIR" ] && continue
    if [ -x "$dir/rpmbuild" ]; then
        REAL_RPMBUILD="$dir/rpmbuild"
        break
    fi
done < <(echo "$PATH" | tr ':' '\n')

if [ -z "$REAL_RPMBUILD" ]; then
    echo "rpmbuild-compat: ERROR: could not find real rpmbuild binary in PATH" >&2
    exit 1
fi

# ── Parse rpmbuild arguments ──────────────────────────────────────────────────
# We need: --define "_topdir <path>", --define "buildroot <path>", and the .spec path
TOPDIR=""
STAGING_DIR=""
SPEC=""

args=("$@")
i=0
while [ "$i" -lt "${#args[@]}" ]; do
    arg="${args[$i]}"
    if [ "$arg" = "--define" ]; then
        i=$((i + 1))
        define="${args[$i]}"
        key="${define%% *}"
        value="${define#* }"
        case "$key" in
            _topdir)   TOPDIR="$value" ;;
            buildroot) STAGING_DIR="$value" ;;
        esac
    elif [[ "$arg" == *.spec ]]; then
        SPEC="$arg"
    fi
    i=$((i + 1))
done

# ── Apply compat patch if this looks like an fpm-generated spec ───────────────
if [ -n "$TOPDIR" ] \
    && [ -n "$STAGING_DIR" ] \
    && [ -n "$SPEC" ] \
    && [ -f "$SPEC" ] \
    && grep -q '^%install' "$SPEC" \
    && grep -qF '# noop' "$SPEC"; then

    echo "rpmbuild-compat: applying fpm/rpm-6.x compatibility patch" >&2

    # Save a hard-linked copy of the staged files to a location outside BUILD/
    # so that %mkbuilddir's "rm -rf %{buildroot}" cannot touch them.
    SAVED_STAGING="$TOPDIR/fpm-saved-staging"
    rm -rf "$SAVED_STAGING"
    mkdir -p "$SAVED_STAGING"

    # Hard-link each top-level item from the staging dir into SAVED_STAGING.
    # We use find + cp -al so that:
    #   - Directories are recreated (directories can't be hard-linked)
    #   - Regular files are hard-linked (O(1) time, no extra disk usage)
    #   - Symlinks are copied as symlinks
    while IFS= read -r item; do
        cp -al "$item" "$SAVED_STAGING/"
    done < <(find "$STAGING_DIR" -maxdepth 1 -mindepth 1)

    # Patch the spec: replace "# noop" inside %install with a cp command that
    # restores the saved files into %{buildroot} (which %mkbuilddir will have
    # just created as a fresh empty directory).
    PATCHED_SPEC="${SPEC}.compat-patched"

    awk -v saved="$SAVED_STAGING" '
        /^%install/       { in_install = 1; print; next }
        /^%[a-zA-Z]/      { in_install = 0 }
        in_install && /^# noop/ {
            print "# compat: restore fpm-staged files after rpm 6.x %mkbuilddir"
            print "cp -al " saved "/. %{buildroot}/"
            next
        }
        { print }
    ' "$SPEC" > "$PATCHED_SPEC"

    # Rebuild the argument list, substituting the original spec with the patched one
    NEW_ARGS=()
    for arg in "${args[@]}"; do
        if [ "$arg" = "$SPEC" ]; then
            NEW_ARGS+=("$PATCHED_SPEC")
        else
            NEW_ARGS+=("$arg")
        fi
    done

    exec "$REAL_RPMBUILD" "${NEW_ARGS[@]}"
fi

# ── Fall through: not an fpm spec, call rpmbuild directly ─────────────────────
exec "$REAL_RPMBUILD" "$@"
