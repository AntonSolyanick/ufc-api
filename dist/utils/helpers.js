"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeBrowser = exports.scrollPageToBottom = exports.clickButton = exports.delay = void 0;
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config();
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
        headless: true,
        executablePath: process.env.CHROME_PATH || '/usr/bin/chromium-browser',
        maxWaitTime: 60000,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ...options,
    };
    const browser = await puppeteer_core_1.default.launch(config);
    const page = await browser.newPage();
    page.goto(url);
    await page.waitForNavigation();
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
