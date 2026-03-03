/* global document */

const htmlInput = document.getElementById('htmlInput');
const textOutput = document.getElementById('textOutput');
const convertBtn = document.getElementById('convertBtn');

async function convertHtml () {
  convertBtn.disabled = true;
  convertBtn.textContent = 'Converting...';

  try {
    const response = await fetch('/api/convert', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ html: htmlInput.value })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to convert HTML');
    }

    textOutput.textContent = data.text;
  } catch (error) {
    textOutput.textContent = `Error: ${error.message}`;
  } finally {
    convertBtn.disabled = false;
    convertBtn.textContent = 'Convert';
  }
}

convertBtn.addEventListener('click', convertHtml);
