// EmergencyServiceHandler.js
// Handles emergency contact and alert logic
// Note: The Django API doesn't have emergency endpoints, so keeping SMTP logic as fallback

import { createClient } from "smtpexpress";

const smtpexpressClient = createClient({
    projectId: "sm0pid-3B86jiSP0ZJrEKGTqnWdjpIXR",
    projectSecret: "eb3b6d63cc0293b67165fd9e49afa2df4202a25fbaa1ada1c5"
});

const createMessage = (email, name, medication) => ({
    subject: "Emergency Email",
    message: `Hello, \n \n We noticed that DoseAlert user ${name} has not been taking their ${medication} as scheduled.\n Please feel free to check in and ensure they are on track with their medication routine. \n\nBest regards,\nThe DoseAlert Team`,
    sender: {
        name: "Dose Alert",
        email: "dose-alert-d49ced@projects.smtpexpress.com"
    },
    recipients: email,
});

// Send emergency email via SMTP Express (fallback since no Django endpoint exists)
export async function emailEmergencyContact(email, name, medication) {
    try {
        const response = await smtpexpressClient.sendApi.sendMail(createMessage(email, name, medication));
        console.log(response);
        return response;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Placeholder for future Django API integration
export async function sendEmergencyAlert(token, message) {
    throw new Error('Emergency alert endpoint not implemented in backend API.');
}

// Default export for backward compatibility
export default emailEmergencyContact;
