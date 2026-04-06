const { Parser } = require('json2csv');

const exportToCSV = (data, baseFilename = 'export') => {
  try {
    const parser = new Parser({
      defaultValue: '',
      quote: '"',
      delimiter: ','
    });

    const csv = parser.parse(data);
    const filename = `${baseFilename}-${new Date().toISOString().slice(0,10)}.csv`;

    return { csv, filename };
  } catch (error) {
    console.error('Error generando CSV:', error);
    throw new Error('Error al generar el archivo CSV');
  }
};

module.exports = { exportToCSV };