function getHtmlFromRequest (req) {
  if (req && req.body && typeof req.body.html === 'string') {
    return req.body.html;
  }
  if (req && req.query && typeof req.query.html === 'string') {
    return req.query.html;
  }
  return '';
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

module.exports = async function (context, req) {
  try {
    const html = getHtmlFromRequest(req);
    if (!html) {
      context.res = {
        status: 400,
        headers: { 'content-type': 'application/json' },
        body: { error: 'Provide HTML in request body as { "html": "..." } or query ?html=...' }
      };
      return;
    }

    let text = '';
    try {
      const htmlToTextPackage = require('html-to-text');
      if (htmlToTextPackage && typeof htmlToTextPackage.htmlToText === 'function') {
        text = htmlToTextPackage.htmlToText(html, { wordwrap: 100 });
      } else {
        text = fallbackConvert(html);
      }
    } catch (loadError) {
      text = fallbackConvert(html);
    }

    context.res = {
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: { text: text }
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: { 'content-type': 'application/json' },
      body: {
        error: 'Conversion failed',
        message: error && error.message ? error.message : 'Unknown error'
      }
    };
  }
};
