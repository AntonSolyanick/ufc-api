// import { Page } from 'puppeteer-core'
import mongoose, { Model } from 'mongoose'
import dotenv from 'dotenv'
import slugify from 'slugify'

import Fighter, { FighterRecord } from '../model/fighterModel'
import {
    disconnectDB,
    connectDB,
    initializeBrowser,
    ParseOptions,
    clickButton,
    delay,
} from './helpers'

import {
    UFC_EVENT_URL,
    UFC_URL,
    UFC_URL_PARAMS,
    NO_PHOTO_FIGHTER,
} from '../config'

dotenv.config()

const namesParser = async (options?: ParseOptions) => {
    console.log('Start names parsing')

    try {
        const { browser, page } = await initializeBrowser(
            `${UFC_URL}${UFC_URL_PARAMS}`
        )

        if (!page) return

        // переключение на английский язык
        // await scrollPageToBottom(page)
        // await setEnglishLanguage(page)

        // Добавляем query-параметры после переключения языка для избежание редиректа на домен .ru
        // const targetUrl = `${UFC_URL}${UFC_URL_PARAMS}`
        // await page.goto(targetUrl, {
        //     waitUntil: 'networkidle2',
        //     timeout: 60000,
        // })

        while (await clickButton(page, '[title="Load more items"]')) {
            await delay(1000)
        }

        const parsedNames = await page.evaluate(() => {
            const names = Array.from(
                document.querySelectorAll('.c-listing-athlete__name')
            )
            const uniqueNames = new Set(
                names.map((el) => el.textContent?.trim() || '')
            )
            return Array.from(uniqueNames)
        })

        console.log('finish names parsing')

        browser.close()
        return parsedNames.map((name: string) => {
            return { name, slug: slugify(name) }
        })
    } catch (err) {
        console.error('Something went wrong!', err)
    }
}

let fighterNumber = 0
const fighterDataParser: Function = async (fighterSlugName: string) => {
    console.log('Fighter data parsing', fighterNumber, fighterSlugName)
    fighterNumber++
    try {
        if (!fighterSlugName) return
        const { browser, page } = await initializeBrowser(
            `${UFC_EVENT_URL}${fighterSlugName}`
        )
        if (!page) return

        const parsedData = await page.evaluate((NO_PHOTO_FIGHTER: string) => {
            const fighterImage =
                document
                    .querySelector('.hero-profile__image')
                    ?.getAttribute('src') || NO_PHOTO_FIGHTER
            const fighterRusName = document.querySelector(
                '.hero-profile__name'
            )?.textContent

            let fighterRating: number | null = null
            let fighterWeightCategory = document.querySelector(
                '.hero-profile__division-title'
            )?.textContent

            const fighterProfileTags =
                document.querySelectorAll('.hero-profile__tag')
            fighterProfileTags.forEach((tag) => {
                if (fighterRating) return
                if (tag.textContent === 'Обладатель титула') {
                    fighterRating = 0
                    return
                }
                if (
                    tag.textContent?.includes('вес') &&
                    tag.textContent?.includes('#')
                ) {
                    fighterRating = tag.textContent
                        .match(/-?\d+\.?\d*/g)!
                        .map(Number)[0]
                }
            })
            const fighterRecord: FighterRecord = {}
            document
                .querySelector('.hero-profile__division-body')
                ?.textContent?.match(/-?\d+\.?\d*/g)
                ?.map((recordStat, i) => {
                    if (i === 0)
                        fighterRecord.wins = Math.abs(Number(recordStat))
                    if (i === 1)
                        fighterRecord.loses = Math.abs(Number(recordStat))
                    if (i === 2)
                        fighterRecord.draws = Math.abs(Number(recordStat))
                })

            const nextFightContainer = document.querySelector(
                '.c-card-event--upcoming'
            )

            if (!nextFightContainer) {
                return {
                    fighterImage,
                    fighterRusName,
                    fighterRating,
                    fighterWeightCategory,
                    fighterRecord,
                    nextFightInfo: {},
                }
            }

            const nextFightHeadline: HTMLElement =
                nextFightContainer?.querySelector(
                    '.c-card-event--athlete-fight__headline'
                )!

            const capitalizeFirstLetter = (val: string) => {
                const newString = val.trim()
                return (
                    String(newString).charAt(0).toUpperCase() +
                    String(newString).slice(1).toLocaleLowerCase()
                )
            }

            let firstFighterName = capitalizeFirstLetter(
                nextFightHeadline?.innerText?.split('VS')[0]
            )

            let secondFighterName = capitalizeFirstLetter(
                nextFightHeadline?.innerText?.split('VS')[1]
            )

            const fightersSmallImgs = nextFightContainer?.querySelectorAll(
                '.image-style-event-results-athlete-headshot'
            )

            let firstFighterSmallImg = NO_PHOTO_FIGHTER
            let secondFighterSmallImg = NO_PHOTO_FIGHTER
            if (fightersSmallImgs) {
                firstFighterSmallImg = fightersSmallImgs[0].getAttribute('src')!
                secondFighterSmallImg =
                    fightersSmallImgs[1].getAttribute('src')!
            }

            if (fighterRusName?.includes(secondFighterName)) {
                ;[firstFighterName, secondFighterName] = [
                    secondFighterName,
                    firstFighterName,
                ]
                ;[firstFighterSmallImg, secondFighterSmallImg] = [
                    secondFighterSmallImg,
                    firstFighterSmallImg,
                ]
            }

            const fightDate = nextFightContainer?.querySelector(
                '.c-card-event--athlete-fight__date'
            )?.textContent

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
            }
        }, NO_PHOTO_FIGHTER)

        browser.close()
        return parsedData
    } catch (err) {
        console.error(err)
    }
}

const populateCollection: Function = async (
    fighters: { name: string; slug: string }[],
    parser: Function,
    Model: Model<mongoose.Document>
) => {
    try {
        const totalFightersData = []
        for (let i = 0; i < fighters.length; i++) {
            const additionalIfo = await parser(`${fighters[i].slug}`)
            totalFightersData.push({ ...fighters[i], ...additionalIfo })
        }

        const topRatingFighters = totalFightersData
            .filter((fighter) => fighter.fighterRating)
            .sort((a, b) => a.fighterRating - b.fighterRating)
        const lowRatingFighters = totalFightersData.filter(
            (fighter) => !fighter.fighterRating
        )

        const sortedFighters = [...topRatingFighters, ...lowRatingFighters]
        console.log('Populating mongo collection')

        await Model.bulkWrite(
            sortedFighters.map((fighter) => ({
                updateOne: {
                    filter: { name: fighter.name },
                    update: { $set: fighter },
                    upsert: true,
                },
            }))
        )
    } catch (err) {
        console.log(err)
    }
}
const runParsers = async () => {
    try {
        await connectDB()
        const parsedNames = await namesParser()
        await populateCollection(parsedNames, fighterDataParser, Fighter)

        console.log('parsing compleated')
        disconnectDB()
        process.exit()
    } catch (err) {
        console.error('errr', err)
        process.exit(1)
    }
}

runParsers()
