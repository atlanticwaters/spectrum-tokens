export default {
  files: ["test/**/*.test.ts"],
  extensions: {
    ts: "module",
  },
  nodeArguments: ["--import=tsx", "--no-warnings"],
  timeout: "30s",
  concurrency: 5,
  failFast: false,
  verbose: true,
  workerThreads: false,
};
