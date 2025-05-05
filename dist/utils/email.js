"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Email = void 0;
const pug_1 = __importDefault(require("pug"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const html_to_text_1 = require("html-to-text");
class Email {
    to;
    firstName;
    url;
    from;
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `UFC EVENTS <${process.env.EMAIL_FROM}>`;
    }
    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            return nodemailer_1.default.createTransport({
                host: 'smtp.sendgrid.net',
                port: 587, // или 465 для SSL
                secure: false, // true для 465 порта, false для других
                auth: {
                    user: 'apikey', // всегда 'apikey' для SendGrid
                    pass: process.env.SENDGRID_API_KEY,
                },
            });
        }
        return nodemailer_1.default.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT, 10),
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }
    async send(template, subject) {
        const html = pug_1.default.renderFile(`${__dirname}/../views/email/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject,
        });
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: (0, html_to_text_1.htmlToText)(html),
        };
        await this.newTransport().sendMail(mailOptions);
    }
    async sendWelcome() {
        await this.send('welcome', 'Регистрация подтверждена!');
    }
    async sendPasswordReset() {
        await this.send('passwordReset', 'Ваш токен для смены пароля (действителен в течении 10 минут!)');
    }
}
exports.Email = Email;
