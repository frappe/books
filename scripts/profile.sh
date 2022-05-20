#! /bin/sh

# https://nodejs.org/en/docs/guides/simple-profiling/

export TS_NODE_COMPILER_OPTIONS='{"module":"commonjs"}'

rm ./isolate-*-v8.log 2> /dev/null
rm ./profiler-output.log 2> /dev/null

echo "running profile.ts"
node --require ts-node/register --require tsconfig-paths/register --prof ./scripts/profile.ts

echo "processing tick file"
node --prof-process ./isolate-*-v8.log > ./profiler-output.log && echo "generated profiler-output.log"
rm ./isolate-*-v8.log