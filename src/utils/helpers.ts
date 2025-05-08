import puppeteer, { Page } from 'puppeteer-core'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

export interface ParseOptions {
    headless?: boolean
    executablePath?: string
    maxWaitTime?: number
}

export const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms))

export const clickButton = async (page: Page, selector: string) => {
    try {
        const button = await page.waitForSelector(selector, {
            visible: true,
            timeout: 5000,
        })
        await button!.evaluate((btn: Element) => {
            btn.scrollIntoView({ behavior: 'smooth', block: 'center' })
            const htmlElement = btn as HTMLElement
            htmlElement.click()
        })
        await delay(2000)
        return true
    } catch (error) {
        return false
    }
}

export const scrollPageToBottom = async (
    page: Page,
    scrollStep = 250,
    scrollDelay = 100
) => {
    await page.evaluate(
        async (step, delay) => {
            await new Promise<void>((resolve) => {
                let totalHeight = 0
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight
                    window.scrollBy(0, step)
                    totalHeight += step

                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer)
                        resolve()
                    }
                }, delay)
            })
        },
        scrollStep,
        scrollDelay
    )
}

export const initializeBrowser = async (
    url: string,
    options?: ParseOptions
) => {
    const config = {
        ignoreHTTPSErrors: true,
        headless: true,
        executablePath: process.env.CHROME_PATH || '/usr/bin/chromium-browser',
        maxWaitTime: 60000,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ...options,
    }

    const browser = await puppeteer.launch(config)
    const page = await browser.newPage()
    try {
        page.goto(url, { timeout: 120000 })
    } catch (error) {
        console.error(`Сайт недоступен: ${url}`)
        await browser.close()
        return { browser: null, page: null }
    }

    await page.waitForNavigation()
    return { browser, page }
}

const DB = process.env.DATABASE!

export async function connectDB() {
    await mongoose
        .connect(DB)
        .then((connection) => console.log('you are connected to the DB'))
}

export async function disconnectDB() {
    await mongoose.disconnect()
}
