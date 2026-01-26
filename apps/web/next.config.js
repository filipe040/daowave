/** @type {import('next').NextConfig} */
const nextConfig = {
  // Expose NODE_ENV to client for beta banner
  env: {
    NEXT_PUBLIC_NODE_ENV: process.env.NODE_ENV || "development",
  },
  images: {
    domains: [],
  },

  // Mark bullmq and ioredis as external packages to prevent bundling during build
  // CRITICAL: These packages should NOT be bundled - they try to connect to Redis
  // Note: These are now optionalDependencies, so they may not be installed
  serverExternalPackages: ['bullmq', 'ioredis'],

  // Exclude test files from build
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    // Mark bullmq and ioredis as external to prevent Redis connection during build
    // CRITICAL: These packages should NOT be bundled - they try to connect to Redis
    if (isServer) {
      // Ignore these packages completely - they're optional and not needed
      config.resolve.alias = {
        ...config.resolve.alias,
        'ioredis': false,
        'bullmq': false,
      };
      
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        'bullmq',
        'ioredis',
      ];
    }

    // Ignore warnings from Sentry/OpenTelemetry (known issue with dynamic imports)
    config.ignoreWarnings = [
      {
        module: /@opentelemetry\/instrumentation/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
      {
        module: /@sentry\/opentelemetry/,
        message: /Critical dependency/,
      },
      // DISABLED - Redis completely disabled
      // {
      //   module: /bullmq/,
      //   message: /Critical dependency: the request of a dependency is an expression/,
      // },
    ];

    return config;
  },
  // Exclude test files from compilation
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
