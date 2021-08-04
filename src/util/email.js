//sendgrid setup
const sgMail = require('@sendgrid/mail');
const fs = require("fs");
const dotenv = require('dotenv');
dotenv.config();

const sendGridAPIKey = process.env.SENDGRID_API_KEY ;
sgMail.setApiKey(sendGridAPIKey);

const sendWelcomeEmail = (email, name, password)=>{

    sgMail.send({
        to:email,
        from:'ayushthakurofficial1@gmail.com',
        subject:'Thanks for joining in!',
        text: `Welcome to the app, ${name}, your password is ${password}.`,
    }).catch(err=>{
        throw new Error(err);
    })
}
const sendInvoiceEmail = (name,email)=>{
    pathToAttachment = `${__dirname}\generatedPDF\invoice.pdf`;
    attachment = fs.readFileSync(pathToAttachment).toString("base64")
    sgMail.send({
        to:email,
        from:'ayushthakurofficial1@gmail.com',
        subject:'Thanks for joining in!',
        text: `here is you Invoice ${name}, hope you like the experience, come again!`,
        attachments: [
            {
              content: attachment,
              filename: "invoice.pdf",
              type: "application/pdf",
              disposition: "attachment"
            }
          ]
    }).catch(err=>{
        throw new Error(err);
    })
}
const sendCancelationEmail = (email, name)=>{
    sgMail.send({
        to:email,
        from:'ayushthakurofficial1@gmail.com',
        subject:'bye bye!',
        text: `its so sad to see you go, ${name}. `
    }).catch(err=>{
        throw new Error(err);
    })
}
module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail,
    sendInvoiceEmail
}
