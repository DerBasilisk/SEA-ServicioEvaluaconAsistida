// backend/services/csv.service.js
const { Parser } = require('json2csv');

const exportToCSV = (data, filename = 'export.csv') => {
  try {
    const parser = new Parser({
      defaultValue: '',        // valor por defecto si un campo es null/undefined
      quote: '"',
      delimiter: ','
    });
    
    const csv = parser.parse(data);
    
    return {
      csv,
      filename: `${filename}-${new Date().toISOString().slice(0,10)}.csv`
    };
  } catch (error) {
    console.error('Error generando CSV:', error);
    throw new Error('Error al generar el archivo CSV');
  }
};

module.exports = {
  exportToCSV
};