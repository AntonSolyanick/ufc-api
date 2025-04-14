import puppeteer from 'puppeteer-core'
import dotenv from 'dotenv'

dotenv.config()

export const getBrowserPage: any = async (url: string) => {
    // console.log(process.env.DATABASE || '/usr/bin/chromium')

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
