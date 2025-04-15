import puppeteer from 'puppeteer-core'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

export const getBrowserPage: any = async (url: string) => {
    const browser = await puppeteer.launch({
        executablePath: process.env.CHROME_PATH || '/usr/bin/chromium', // Путь в GitHub Actions
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // Обход ограничений
        headless: true, // Обязательно true!
    })
    const page = await browser.newPage()
    page.setDefaultNavigationTimeout(0)
    page.goto(url)
    await page.waitForNavigation()

    return [page, browser]
}

const DB = process.env.DATABASE!

export function connectDB() {
    mongoose
        .connect(DB)
        .then((connection) => console.log('you are connected to the DB'))
}

export async function disconnectDB() {
    await mongoose.disconnect()
}
