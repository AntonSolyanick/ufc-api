import puppeteer from 'puppeteer'

export const getBrowserPage: any = async (url: string) => {
    const browser = await puppeteer.launch({ headless: false })
    const page = await browser.newPage()
    page.setDefaultNavigationTimeout(0)
    page.goto(url)
    await page.waitForNavigation()

    return [page, browser]
}
