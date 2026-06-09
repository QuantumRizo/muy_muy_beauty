module.exports = {
  stylesheet: ['style.css'],
  pdf_options: {
    format: 'A4',
    margin: '20mm',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; color: #999;">MUYMUY Beauty Studio - <span class="pageNumber"></span></div>'
  },
  launch_options: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
};
