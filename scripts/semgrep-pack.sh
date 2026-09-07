#!/usr/bin/env bash
# PackWebsite Semgrep rule pack: liveViewUrl query leaks and merchant-host iframes.
# Gate is `semgrep --test` on paired files (dotted `.semgrep/` drops auto-discovery).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export SEMGREP_SEND_METRICS=off

SEMGREP_INSTALL_LINE='python3 -m pip install --user semgrep'
RULES="${ROOT}/.semgrep/pack-security.yaml"
TEST_TSX="${ROOT}/.semgrep/pack-security.tsx"

pyver="$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')"
export PATH="${HOME}/.local/bin:${HOME}/Library/Python/${pyver}/bin:${PATH}"

semgrep_bin() {
  if command -v semgrep >/dev/null 2>&1; then
    echo semgrep
    return 0
  fi
  if python3 -m semgrep --help >/dev/null 2>&1; then
    echo python3 -m semgrep
    return 0
  fi
  return 1
}

ensure_semgrep() {
  if semgrep_bin >/dev/null; then
    return 0
  fi
  echo "semgrep missing; installing via ${SEMGREP_INSTALL_LINE}" >&2
  if ! python3 -m pip install --user semgrep; then
    echo "FAIL: ${SEMGREP_INSTALL_LINE}" >&2
    exit 1
  fi
  if semgrep_bin >/dev/null; then
    return 0
  fi
  echo "FAIL: semgrep still missing after ${SEMGREP_INSTALL_LINE}" >&2
  exit 1
}

run_semgrep() {
  local bin
  bin="$(semgrep_bin)"
  # shellcheck disable=SC2086
  ${bin} "$@"
}

require_file() {
  local p="$1"
  if [[ ! -f "${p}" ]]; then
    echo "FAIL: missing ${p}" >&2
    exit 1
  fi
}

ensure_semgrep
require_file "${RULES}"
require_file "${TEST_TSX}"

# --test on a dotted dir drops yaml (parent.name.startswith(".")); pair the files.
echo "==> semgrep --test pack-security.yaml + pack-security.tsx"
set +e
test_out="$(run_semgrep --metrics off --test --config "${RULES}" "${TEST_TSX}" 2>&1)"
test_ec=$?
set -e
printf '%s\n' "${test_out}"
if [[ "${test_ec}" -ne 0 ]] || ! grep -q 'All tests passed' <<<"${test_out}"; then
  echo "FAIL: semgrep --test did not pass all rule-pack tests" >&2
  exit 1
fi
if grep -q 'No unit tests found' <<<"${test_out}"; then
  echo "FAIL: semgrep --test dropped the rule pack (dotted-dir); pair yaml+tsx" >&2
  exit 1
fi

echo "semgrep-pack ok"
