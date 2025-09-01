module.exports = [
  {
    name: 'users',
    port: 4101,
    v1: '../openapi/users/v1.yaml',
    v2: '../openapi/users/v2.yaml',
    flipAfterMs: 30_000,   // flip once to v2 after 30s
    flipBackEveryMs: 0,    // no flip back
    description: 'Field rename: username → handle'
  },
  {
    name: 'orders',
    port: 4102,
    v1: '../openapi/orders/v1.yaml',
    v2: '../openapi/orders/v2.yaml',
    flipAfterMs: 150_000,  // flip once to v2 after 150s
    flipBackEveryMs: 0,
    description: 'New required header + cancel endpoint'
  },
  {
    name: 'weather',
    port: 4103,
    v1: '../openapi/weather/v1.yaml',
    v2: '../openapi/weather/v2.yaml',
    flipAfterMs: 90_000,   // flip once to v2 after 90s
    flipBackEveryMs: 0,
    description: 'New required query parameter'
  },
  {
    name: 'payments',
    port: 4104,
    v1: '../openapi/payments/v1.yaml',
    v2: '../openapi/payments/v2.yaml',
    flipAfterMs: 180_000,  // flip once to v2 after 180s
    flipBackEveryMs: 0,
    description: 'Auth scheme change: API Key → Bearer'
  },
  {
    name: 'inventory',
    port: 4105,
    v1: '../openapi/inventory/v1.yaml',
    v2: '../openapi/inventory/v2.yaml',
    flipAfterMs: 120_000,  // flip once to v2 after 120s (2 minutes)
    flipBackEveryMs: 0,
    description: 'Response structure: Array → { data, cursor }'
  },
  {
    name: 'notifications',
    port: 4106,
    v1: '../openapi/notifications/v1.yaml',
    v2: '../openapi/notifications/v2.yaml',
    flipAfterMs: 60_000,   // flip once to v2 after 60s
    flipBackEveryMs: 0,
    description: 'New webhooks + 429 responses + header changes'
  }
];
