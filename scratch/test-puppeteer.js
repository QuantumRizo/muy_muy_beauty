const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting puppeteer test...');
  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('Browser launched successfully!');
    const page = await browser.newPage();
    await page.setContent('<h1>Hello World</h1>');
    const pdf = await page.pdf({ format: 'A4' });
    console.log('PDF generated successfully, size:', pdf.length);
    await browser.close();
  } catch (err) {
    console.error('Error during puppeteer execution:', err);
  }
})();
