const { mdToPdf } = require('md-to-pdf');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const configPath = path.join(__dirname, 'md-to-pdf.config.js');
    const config = require(configPath);
    
    // md-to-pdf expects stylesheet to be resolved relative to the input file, 
    // but when using the programmatic API, we should make sure the paths are resolved.
    // We override stylesheet to be absolute to style.css in the docs folder.
    config.stylesheet = [path.join(__dirname, 'style.css')];

    console.log('📄 Iniciando compilación de Manual de Empleados...');
    const pdfEmpleados = await mdToPdf(
      { path: path.join(__dirname, 'manual_empleados.md') },
      config
    );
    fs.writeFileSync(path.join(__dirname, 'manual_empleados.pdf'), pdfEmpleados.content);
    console.log('✅ manual_empleados.pdf generado con éxito.');

    console.log('📄 Iniciando compilación de Manual de Administradores...');
    const pdfAdmins = await mdToPdf(
      { path: path.join(__dirname, 'manual_administradores.md') },
      config
    );
    fs.writeFileSync(path.join(__dirname, 'manual_administradores.pdf'), pdfAdmins.content);
    console.log('✅ manual_administradores.pdf generado con éxito.');

    console.log('🎉 Todos los manuales se han compilado exitosamente.');
  } catch (err) {
    console.error('❌ Error durante la compilación de los manuales:', err);
    process.exit(1);
  }
})();
