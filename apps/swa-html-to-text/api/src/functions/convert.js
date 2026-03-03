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

async function getHtmlFromBody (request) {
  try {
    const rawBody = await request.text();
    if (typeof rawBody !== 'string' || !rawBody.trim()) {
      return '';
    }

    try {
      const parsedBody = JSON.parse(rawBody);
      if (parsedBody && typeof parsedBody.html === 'string') {
        return parsedBody.html;
      }
      if (typeof parsedBody === 'string') {
        return parsedBody;
      }
      return rawBody;
    } catch (error) {
      return rawBody;
    }
  } catch (error) {
    return '';
  }
}

app.http('convert', {
  authLevel: 'anonymous',
  handler: async (request) => {
    const htmlFromBody = await getHtmlFromBody(request);
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
