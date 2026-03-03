const { app } = require('@azure/functions');


app.http('ping', {
  authLevel: 'anonymous',
  handler: async () => ({
    status: 200,
    jsonBody: { ok: true, service: 'swa-api-v4' }
  }),
  methods: ['GET'],
  route: 'ping'
});
