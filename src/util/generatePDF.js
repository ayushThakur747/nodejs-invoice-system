const pdf = require('html-pdf');
const ejs = require("ejs");
const path = require("path");
var options = { format: 'A4' };
const sgMail = require('@sendgrid/mail');
const fs = require("fs");
const dotenv = require('dotenv');
dotenv.config();

const sendGridAPIKey = process.env.SENDGRID_API_KEY ;
sgMail.setApiKey(sendGridAPIKey);

const generatePDFandSendEmail = async (invoice)=>{
    console.log(invoice);
    await ejs.renderFile(path.join(__dirname, '../views/', "invoicePdf.ejs"), {invoice}, async (err, data) => {
    
        await pdf.create(data, options).toBuffer(async function(err, res) {
            if(err){
                throw new Error(err);
            }
            const pdfData = await res.toString('base64');
            const customerName = invoice.customerName;
            const customerEmail = invoice.customerEmail;
        
                sgMail.send({
                    to:customerEmail,
                    from:'ayushthakurofficial1@gmail.com',
                    subject:'Thanks for joining in!',
                    text: `here is you Invoice ${customerName},
                           hope you like the experience, come again!`,
                    attachments: [
                        {
                          content: pdfData,
                          filename: "invoice.pdf",
                          type: "application/pdf",
                          disposition: "attachment"
                        }
                      ]
                }).catch(err=>{
                    throw new Error(err);
                })
            
      })
    })
}
module.exports = generatePDFandSendEmail;
