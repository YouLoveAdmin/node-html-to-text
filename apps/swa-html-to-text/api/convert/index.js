const { htmlToText } = require('html-to-text');


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

    const text = htmlToText(html, { wordwrap: 100 });

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
      body: { error: 'Conversion failed' }
    };
  }
};
