const { spawnSync } = require('child_process');
const { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } = require('fs');
const { tmpdir } = require('os');
const { resolve, join } = require('path');

const script = resolve(__dirname, '../run-maestro.sh');

test.each([
  ['stops retrying after success', 1, 1, 0],
  ['allows success on the third attempt', 3, 3, 0],
  ['continues other flows and fails after three unsuccessful attempts', 4, 3, 1],
])('%s', (_, succeedAt, attempts, status) => {
  const cwd = mkdtempSync(join(tmpdir(), 'maestro-runner-'));
  try {
    mkdirSync(join(cwd, '.maestro/subflows'), { recursive: true });
    for (const flow of ['a first.yaml', 'b.yaml', 'subflows/fragment.yaml']) {
      writeFileSync(join(cwd, '.maestro', flow), '');
    }
    writeFileSync(join(cwd, '.maestro/a first.yaml.attempts'), '0');
    writeFileSync(join(cwd, 'maestro'), `#!/bin/sh
[ "$1" = test ] || exit 2
printf '%s\\n' "$2" >> calls
if [ "$2" = '.maestro/a first.yaml' ]; then
  attempt=$(cat "$2.attempts")
  attempt=$((attempt + 1))
  echo "$attempt" > "$2.attempts"
  [ "$attempt" -ge "$SUCCEED_AT" ]
else
  exit 0
fi
`, { mode: 0o755 });

    const result = spawnSync('bash', [script], {
      cwd,
      env: { ...process.env, PATH: `${cwd}:${process.env.PATH}`, SUCCEED_AT: String(succeedAt) },
      encoding: 'utf8',
      timeout: 10000,
    });

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(status);
    expect(readFileSync(join(cwd, 'calls'), 'utf8').trim().split('\n')).toEqual([
      ...Array(attempts).fill('.maestro/a first.yaml'),
      '.maestro/b.yaml',
    ]);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
