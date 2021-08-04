var fs = require('fs');
var pdf = require('html-pdf');
//var html = fs.readFileSync('../views/invoicePdf.ejs', 'utf8');
var options = { format: 'A4' };

const generatePDF = (html)=>{
    pdf.create(html, options).toFile('./generatedPDF/invoice.pdf', function(err, res) {
        if(err){
            return console.log(err,"generate pdf create")
        }
      });
}
module.exports = generatePDF;
