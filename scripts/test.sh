TEST_PATH=$@

if [ $# -eq 0 ]
  then
    TEST_PATH=./**/tests/**/*.spec.ts
fi

./scripts/runner.sh ./node_modules/.bin/tape $TEST_PATH | ./node_modules/.bin/tap-spec