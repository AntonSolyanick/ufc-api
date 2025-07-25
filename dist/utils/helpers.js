"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeBrowser = exports.scrollPageToBottom = exports.clickButton = exports.delay = exports.capitalizeFirstLetter = void 0;
exports.setEnglishLanguage = setEnglishLanguage;
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config();
const capitalizeFirstLetter = (val) => {
    return (String(val).charAt(0).toUpperCase() +
        String(val).slice(1).toLocaleLowerCase());
};
exports.capitalizeFirstLetter = capitalizeFirstLetter;
async function setEnglishLanguage(page) {
    const currentLang = await page.evaluate(() => document.documentElement.lang);
    if (currentLang === 'en') {
        console.log('Already in English language');
        return;
    }
    try {
        (0, exports.clickButton)(page, '.block-ufc-localization-title');
        (0, exports.clickButton)(page, 'ul.links > li:first-child > a:first-child');
        await page.waitForNavigation({
            waitUntil: 'networkidle0',
            timeout: 15000,
        });
    }
    catch (error) {
        console.error('Error changing language:', error);
        throw new Error('Failed to set English language');
    }
}
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
exports.delay = delay;
const clickButton = async (page, selector) => {
    try {
        const button = await page.waitForSelector(selector, {
            visible: true,
            timeout: 5000,
        });
        await button.evaluate((btn) => {
            btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const htmlElement = btn;
            htmlElement.click();
        });
        await (0, exports.delay)(2000);
        return true;
    }
    catch (error) {
        return false;
    }
};
exports.clickButton = clickButton;
const scrollPageToBottom = async (page, scrollStep = 250, scrollDelay = 100) => {
    await page.evaluate(async (step, delay) => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, step);
                totalHeight += step;
                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, delay);
        });
    }, scrollStep, scrollDelay);
};
exports.scrollPageToBottom = scrollPageToBottom;
const initializeBrowser = async (url, options) => {
    const config = {
        ignoreHTTPSErrors: true,
        headless: false,
        executablePath: process.env.CHROME_PATH || '/usr/bin/chromium-browser',
        maxWaitTime: 60000,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ...options,
    };
    const browser = await puppeteer_core_1.default.launch(config);
    const page = await browser.newPage();
    try {
        page.goto(url, { timeout: 120000 });
    }
    catch (error) {
        console.error(`Сайт недоступен: ${url}`);
        await browser.close();
        return { browser: null, page: null };
    }
    await page.waitForNavigation({
        waitUntil: 'networkidle0',
        timeout: 60000,
    });
    return { browser, page };
};
exports.initializeBrowser = initializeBrowser;
const DB = process.env.DATABASE;
async function connectDB() {
    await mongoose_1.default
        .connect(DB)
        .then((connection) => console.log('you are connected to the DB'));
}
async function disconnectDB() {
    await mongoose_1.default.disconnect();
}
