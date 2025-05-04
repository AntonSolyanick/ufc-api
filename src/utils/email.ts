import pug from 'pug'
import nodemailer from 'nodemailer'
import { Transporter } from 'nodemailer'
import { htmlToText } from 'html-to-text'

import { UserDocument } from '../model/userModel'

interface MailOptions {
    from: string
    to: string
    subject: string
    html: string
    text: string
}

export class Email {
    private to: string
    private firstName: string
    private url: string
    private from: string

    constructor(user: UserDocument, url: string) {
        this.to = user.email
        this.firstName = user.name.split(' ')[0]
        this.url = url
        this.from = `UFC EVENTS <${process.env.EMAIL_FROM}>`
    }

    private newTransport(): Transporter {
        if (process.env.NODE_ENV === 'production') {
            return nodemailer.createTransport({
                host: 'smtp.sendgrid.net',
                port: 587, // или 465 для SSL
                secure: false, // true для 465 порта, false для других
                auth: {
                    user: 'apikey', // всегда 'apikey' для SendGrid
                    pass: process.env.SENDGRID_API_KEY as string,
                },
            })
        }

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST as string,
            port: parseInt(process.env.EMAIL_PORT as string, 10),
            auth: {
                user: process.env.EMAIL_USERNAME as string,
                pass: process.env.EMAIL_PASSWORD as string,
            },
        })
    }

    private async send(template: string, subject: string): Promise<void> {
        const html = pug.renderFile(
            `${__dirname}/../views/email/${template}.pug`,
            {
                firstName: this.firstName,
                url: this.url,
                subject,
            }
        )

        const mailOptions: MailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText(html),
        }

        await this.newTransport().sendMail(mailOptions)
    }

    public async sendWelcome(): Promise<void> {
        await this.send('welcome', 'Регистрация подтверждена!')
    }

    public async sendPasswordReset(): Promise<void> {
        await this.send(
            'passwordReset',
            'Ваш токен для смены пароля (действителен в течении 10 минут!)'
        )
    }
}
