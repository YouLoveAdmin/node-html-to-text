module.exports = async (context, req) => {
  try {
    const html = req?.body?.html ?? req?.query?.html ?? '';
    if (!html || typeof html !== 'string') {
      context.res = {
        status: 400,
        headers: { 'content-type': 'application/json' },
        body: { error: 'Provide HTML in request body as { "html": "..." } or query ?html=...' }
      };
      return;
    }

    let text;
    try {
      const { htmlToText } = require('html-to-text');
      text = htmlToText(html, { wordwrap: 100 });
    } catch (error) {
      context.log.warn('html-to-text package unavailable, using fallback conversion');
      text = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    context.res = {
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: { text: text }
    };
  } catch (error) {
    context.log.error(error);
    context.res = {
      status: 500,
      headers: { 'content-type': 'application/json' },
      body: { error: 'Conversion failed', message: error.message }
    };
  }
};
