import {  SMTP_USER, SMTP_PASSWORD} from '@env';
import { createClient } from "smtpexpress"

const smtpexpressClient = createClient({
    projectId: "sm0pid-3B86jiSP0ZJrEKGTqnWdjpIXR",
    projectSecret: "eb3b6d63cc0293b67165fd9e49afa2df4202a25fbaa1ada1c5"
  });

const createMessage = (email, name, medication) => {
    return {
        subject: "Emergency Email",
        message: "Hello, \n \n We noticed that DoseAlert user "+name+" has not been taking their "+medication+" as scheduled.\n Please feel free to check in and ensure they are on track with their medication routine. \n\nBest regards,\nThe DoseAlert Team",
        sender: {
          name: "Dose Alert",
          email: "dose-alert-d49ced@projects.smtpexpress.com"
        },
        recipients: email,
    }
}

export default async function emailEmergencyContact(email, name, medication) {
    smtpexpressClient.sendApi.sendMail(createMessage(email, name, medication)).then(response => {
        console.log(response);
      }
        ).catch(error => {
            console.log(error);
        });
}
