const { app } = require('@azure/functions');


function parseBooleanish (value, defaultValue) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') {
      return true;
    }
    if (value.toLowerCase() === 'false') {
      return false;
    }
  }
  return defaultValue;
}

function fallbackConvert (html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function getPayloadFromBody (request) {
  const payload = {
    html: '',
    hyperlink: undefined
  };

  try {
    const rawBody = await request.text();
    if (typeof rawBody !== 'string' || !rawBody.trim()) {
      return payload;
    }

    try {
      const parsedBody = JSON.parse(rawBody);
      if (parsedBody && typeof parsedBody.html === 'string') {
        payload.html = parsedBody.html;
      } else if (parsedBody && typeof parsedBody.body === 'string') {
        payload.html = parsedBody.body;
      } else if (typeof parsedBody === 'string') {
        payload.html = parsedBody;
      } else {
        payload.html = rawBody;
      }

      if (parsedBody && typeof parsedBody === 'object' && Object.hasOwn(parsedBody, 'hyperlink')) {
        payload.hyperlink = parseBooleanish(parsedBody.hyperlink, true);
      }
    } catch (error) {
      payload.html = rawBody;
    }
  } catch (error) {
    return payload;
  }

  return payload;
}

function getPayloadFromQuery (request) {
  const query = request && request.query ? request.query : null;
  return {
    html: query ? query.get('html') || query.get('body') || '' : '',
    hyperlink: parseBooleanish(query ? query.get('hyperlink') : undefined, true)
  };
}

function convertToMarkdown (html, keepHyperlink) {
  try {
    const TurndownService = require('turndown');
    const turndownService = new TurndownService({ headingStyle: 'atx' });
    if (!keepHyperlink) {
      turndownService.addRule('stripLinks', {
        filter: 'a',
        replacement: (content) => content
      });
    }
    return turndownService.turndown(html);
  } catch (error) {
    return fallbackConvert(html);
  }
}

app.http('markdown', {
  authLevel: 'anonymous',
  handler: async (request) => {
    const missingHtmlError = 'Provide HTML in request body as { "html": "..." } or { "body": "..." }, '
      + 'or query ?html=...&hyperlink=true|false';
    const bodyPayload = await getPayloadFromBody(request);
    const queryPayload = getPayloadFromQuery(request);
    const html = bodyPayload.html || queryPayload.html;
    const keepHyperlink = (bodyPayload.hyperlink === undefined)
      ? parseBooleanish(queryPayload.hyperlink, true)
      : parseBooleanish(bodyPayload.hyperlink, true);

    if (!html) {
      return {
        status: 400,
        jsonBody: { error: missingHtmlError }
      };
    }

    const markdown = convertToMarkdown(html, keepHyperlink);
    return {
      status: 200,
      jsonBody: { markdown: markdown }
    };
  },
  methods: ['POST', 'GET'],
  route: 'markdown'
});
