const { app } = require('@azure/functions');


function fallbackConvert (html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

app.http('convert', {
  authLevel: 'anonymous',
  handler: async (request) => {
    let htmlFromBody = '';
    try {
      const rawBody = await request.text();
      if (typeof rawBody === 'string' && rawBody.trim()) {
        try {
          const parsedBody = JSON.parse(rawBody);
          if (parsedBody && typeof parsedBody.html === 'string') {
            htmlFromBody = parsedBody.html;
          } else if (typeof parsedBody === 'string') {
            htmlFromBody = parsedBody;
          } else {
            htmlFromBody = rawBody;
          }
        } catch (error) {
          htmlFromBody = rawBody;
        }
      }
    } catch (error) {
      htmlFromBody = '';
    }
    const htmlFromQuery = request && request.query ? request.query.get('html') || '' : '';
    const html = htmlFromBody || htmlFromQuery;

    if (!html) {
      return {
        status: 400,
        jsonBody: { error: 'Provide HTML in request body as { "html": "..." } or query ?html=...' }
      };
    }

    let text = '';
    try {
      const htmlToTextPackage = require('html-to-text');
      if (htmlToTextPackage && typeof htmlToTextPackage.htmlToText === 'function') {
        text = htmlToTextPackage.htmlToText(html, { wordwrap: 100 });
      } else {
        text = fallbackConvert(html);
      }
    } catch (error) {
      text = fallbackConvert(html);
    }

    return {
      status: 200,
      jsonBody: { text: text }
    };
  },
  methods: ['POST', 'GET'],
  route: 'convert'
});
