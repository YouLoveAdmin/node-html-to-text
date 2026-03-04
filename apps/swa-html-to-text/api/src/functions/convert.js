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

async function getPayloadFromBody (request) {
  const payload = {
    html: '',
    hyperlink: true
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

      if (parsedBody && typeof parsedBody === 'object') {
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

function convertWithOptions (html, keepHyperlink) {
  try {
    const htmlToTextPackage = require('html-to-text');
    if (htmlToTextPackage && typeof htmlToTextPackage.htmlToText === 'function') {
      const options = keepHyperlink
        ? { wordwrap: 100 }
        : {
          wordwrap: 100,
          selectors: [{ selector: 'a', options: { ignoreHref: true } }]
        };
      return htmlToTextPackage.htmlToText(html, options);
    }
  } catch (error) {
    return fallbackConvert(html);
  }

  return fallbackConvert(html);
}

app.http('convert', {
  authLevel: 'anonymous',
  handler: async (request) => {
    const bodyPayload = await getPayloadFromBody(request);
    const queryPayload = getPayloadFromQuery(request);
    const html = bodyPayload.html || queryPayload.html;
    const keepHyperlink = parseBooleanish(
      bodyPayload.hyperlink,
      parseBooleanish(queryPayload.hyperlink, true)
    );

    if (!html) {
      return {
        status: 400,
        jsonBody: { error: 'Provide HTML in request body as { "html": "..." } or { "body": "..." }, or query ?html=...&hyperlink=true|false' }
      };
    }

    const text = convertWithOptions(html, keepHyperlink);

    return {
      status: 200,
      jsonBody: { text: text }
    };
  },
  methods: ['POST', 'GET'],
  route: 'convert'
});
