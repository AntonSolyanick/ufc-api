"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const slugify_1 = __importDefault(require("slugify"));
const fighterModel_1 = __importDefault(require("../model/fighterModel"));
const helpers_1 = require("./helpers");
const config_1 = require("../config");
dotenv_1.default.config();
const namesParser = async (options) => {
    console.log('Start names parsing');
    try {
        const { browser, page } = await (0, helpers_1.initializeBrowser)(`${config_1.UFC_URL}${config_1.UFC_URL_PARAMS}`);
        if (!page)
            return;
        // переключение на английский язык
        // await scrollPageToBottom(page)
        // await setEnglishLanguage(page)
        // Добавляем query-параметры после переключения языка для избежание редиректа на домен .ru
        // const targetUrl = `${UFC_URL}${UFC_URL_PARAMS}`
        // await page.goto(targetUrl, {
        //     waitUntil: 'networkidle2',
        //     timeout: 60000,
        // })
        while (await (0, helpers_1.clickButton)(page, '[title="Load more items"]')) {
            await (0, helpers_1.delay)(1000);
        }
        const parsedNames = await page.evaluate(() => {
            const names = Array.from(document.querySelectorAll('.c-listing-athlete__name'));
            const uniqueNames = new Set(names.map((el) => el.textContent?.trim() || ''));
            return Array.from(uniqueNames);
        });
        console.log('finish names parsing');
        browser.close();
        return parsedNames.map((name) => {
            return { name, slug: (0, slugify_1.default)(name) };
        });
    }
    catch (err) {
        console.error('Something went wrong!', err);
    }
};
let fighterNumber = 0;
const fighterDataParser = async (fighterSlugName) => {
    console.log('Fighter data parsing', fighterNumber, fighterSlugName);
    fighterNumber++;
    try {
        if (!fighterSlugName)
            return;
        const { browser, page } = await (0, helpers_1.initializeBrowser)(`${config_1.UFC_EVENT_URL}${fighterSlugName}`);
        if (!page)
            return;
        const parsedData = await page.evaluate((NO_PHOTO_FIGHTER) => {
            const fighterImage = document
                .querySelector('.hero-profile__image')
                ?.getAttribute('src') || NO_PHOTO_FIGHTER;
            const fighterRusName = document.querySelector('.hero-profile__name')?.textContent;
            let fighterRating = null;
            let fighterWeightCategory = document.querySelector('.hero-profile__division-title')?.textContent;
            const fighterProfileTags = document.querySelectorAll('.hero-profile__tag');
            fighterProfileTags.forEach((tag) => {
                if (fighterRating)
                    return;
                if (tag.textContent === 'Обладатель титула') {
                    fighterRating = 0;
                    return;
                }
                if (tag.textContent?.includes('вес') &&
                    tag.textContent?.includes('#')) {
                    fighterRating = tag.textContent
                        .match(/-?\d+\.?\d*/g)
                        .map(Number)[0];
                }
            });
            const fighterRecord = {};
            document
                .querySelector('.hero-profile__division-body')
                ?.textContent?.match(/-?\d+\.?\d*/g)
                ?.map((recordStat, i) => {
                if (i === 0)
                    fighterRecord.wins = Math.abs(Number(recordStat));
                if (i === 1)
                    fighterRecord.loses = Math.abs(Number(recordStat));
                if (i === 2)
                    fighterRecord.draws = Math.abs(Number(recordStat));
            });
            const nextFightContainer = document.querySelector('.c-card-event--upcoming');
            if (!nextFightContainer) {
                return {
                    fighterImage,
                    fighterRusName,
                    fighterRating,
                    fighterWeightCategory,
                    fighterRecord,
                    nextFightInfo: {},
                };
            }
            const nextFightHeadline = nextFightContainer?.querySelector('.c-card-event--athlete-fight__headline');
            // const capitalizeFirstLetter = (val: string) => {
            //     const newString = val.trim()
            //     return (
            //         String(newString).charAt(0).toUpperCase() +
            //         String(newString).slice(1).toLocaleLowerCase()
            //     )
            // }
            let firstFighterName = (0, helpers_1.capitalizeFirstLetter)(nextFightHeadline?.innerText?.split('VS')[0]);
            let secondFighterName = (0, helpers_1.capitalizeFirstLetter)(nextFightHeadline?.innerText?.split('VS')[1]);
            const fightersSmallImgs = nextFightContainer?.querySelectorAll('.image-style-event-results-athlete-headshot');
            let firstFighterSmallImg = NO_PHOTO_FIGHTER;
            let secondFighterSmallImg = NO_PHOTO_FIGHTER;
            if (fightersSmallImgs) {
                firstFighterSmallImg = fightersSmallImgs[0].getAttribute('src');
                secondFighterSmallImg =
                    fightersSmallImgs[1].getAttribute('src');
            }
            if (fighterRusName?.includes(secondFighterName)) {
                ;
                [firstFighterName, secondFighterName] = [
                    secondFighterName,
                    firstFighterName,
                ];
                [firstFighterSmallImg, secondFighterSmallImg] = [
                    secondFighterSmallImg,
                    firstFighterSmallImg,
                ];
            }
            const fightDate = nextFightContainer?.querySelector('.c-card-event--athlete-fight__date')?.textContent;
            return {
                fighterImage,
                fighterRusName,
                fighterRating,
                fighterWeightCategory,
                fighterRecord,
                nextFightInfo: {
                    firstFighterName,
                    secondFighterName,
                    fightDate,
                    firstFighterSmallImg,
                    secondFighterSmallImg,
                },
            };
        }, config_1.NO_PHOTO_FIGHTER);
        console.log(parsedData);
        browser.close();
        return parsedData;
    }
    catch (err) {
        console.error(err);
    }
};
const populateCollection = async (fighters, parser, Model) => {
    try {
        const totalFightersData = [];
        for (let i = 0; i < fighters.length; i++) {
            const additionalIfo = await parser(`${fighters[i].slug}`);
            totalFightersData.push({ ...fighters[i], ...additionalIfo });
        }
        const topRatingFighters = totalFightersData
            .filter((fighter) => fighter.fighterRating)
            .sort((a, b) => a.fighterRating - b.fighterRating);
        const lowRatingFighters = totalFightersData.filter((fighter) => !fighter.fighterRating);
        const sortedFighters = [...topRatingFighters, ...lowRatingFighters];
        console.log('Populating mongo collection');
        await Model.bulkWrite(sortedFighters.map((fighter) => ({
            updateOne: {
                filter: { name: fighter.name },
                update: { $set: fighter },
                upsert: true,
            },
        })));
    }
    catch (err) {
        console.log(err);
    }
};
const runParsers = async () => {
    try {
        console.log('start parsing');
        const parsedNames = await namesParser();
        await populateCollection(parsedNames, fighterDataParser, fighterModel_1.default);
        console.log('parsing compleated');
        (0, helpers_1.disconnectDB)();
        process.exit();
    }
    catch (err) {
        console.error('errr', err);
        process.exit(1);
    }
};
(0, helpers_1.connectDB)();
runParsers();
