import { Model } from 'mongoose'

import { UFC_NAMES_URL, UFC_EVENT_URL } from '../config'
import Fighter from '../model/fighterModel'
import { getBrowserPage } from './helpers'
import { FighterDocument } from '../model/fighterModel'

export const namesParserUFC: Function = async () => {
    try {
        const [page, browser] = await getBrowserPage(UFC_NAMES_URL)

        let fightersNames = await page.evaluate(() => {
            let fightersInfo: Element[] = []
            const tableContainer = Array.from(
                document.querySelectorAll('tbody')
            )
            const tables = tableContainer.map((el) => el.children)
            tables.forEach((el) => (fightersInfo = [...fightersInfo, ...el]))
            const fightersNames = fightersInfo.map(
                (el) => el.firstChild?.textContent
            )
            return fightersNames
        })
        browser.close()
        fightersNames.forEach(
            async (el: string) => await Fighter.create({ name: el })
        )
    } catch (err) {
        console.error(err)
    }
}

export const eventParserUfc: Function = async (fighterSlugName: string) => {
    try {
        const [page, browser] = await getBrowserPage(
            `${UFC_EVENT_URL}${fighterSlugName}`
        )
        const parsedData = await page.evaluate(() => {
            const nextFightContainer = document.querySelector(
                '.c-card-event--upcoming'
            )
            const imagePlug =
                'https://www.ufc.com/themes/custom/ufc/assets/img/no-profile-image.png'

            const fighterImage =
                document
                    .querySelector('.hero-profile__image')
                    ?.getAttribute('src') || imagePlug

            const fighterRusName = document.querySelector(
                '.hero-profile__name'
            )?.textContent

            const nextFightHeadline: HTMLElement =
                nextFightContainer?.querySelector(
                    '.c-card-event--athlete-fight__headline'
                )!

            const firstFighterName =
                nextFightHeadline?.innerText?.split('VS')[0]
            const secondFighterName =
                nextFightHeadline?.innerText?.split('VS')[1]

            const fightersSmallImgs = nextFightContainer?.querySelectorAll(
                '.image-style-event-results-athlete-headshot'
            )

            let firstFighterSmallImg = imagePlug
            let secondFighterSmallImg = imagePlug
            if (fightersSmallImgs) {
                firstFighterSmallImg = fightersSmallImgs[0].getAttribute('src')!
                secondFighterSmallImg =
                    fightersSmallImgs[1].getAttribute('src')!
            }

            const fightDate = nextFightContainer?.querySelector(
                '.c-card-event--athlete-fight__date'
            )?.textContent
            if (!fightDate) {
                return [fighterImage, fighterRusName]
            }

            return [
                fighterImage,
                fighterRusName,
                {
                    firstFighterName,
                    secondFighterName,
                    fightDate,
                    firstFighterSmallImg,
                    secondFighterSmallImg,
                },
            ]
        })
        browser.close()

        return parsedData
    } catch (err) {
        console.error(err)
    }
}

const populateCollection: Function = async (
    Model: Model<FighterDocument>,
    eventParser: Function
) => {
    try {
        const fighters: FighterDocument[] = await Model.find()

        for (let i = 0; i < fighters.length; i++) {
            const [fighterImage, fighterRusName, nextFightInfo] =
                await eventParser(`${fighters[i].slug}`)

            if (!fighterRusName) continue
            if (!nextFightInfo) {
                await Model.findOneAndUpdate(
                    { slug: fighters[i].slug },
                    { fighterRusName, fighterImage }
                )
                continue
            }
            await Model.findOneAndUpdate(
                { slug: fighters[i].slug },
                { fighterRusName, fighterImage, nextFightInfo }
            )
        }
    } catch (err) {
        console.log(err)
    }
}

export const runParsers = async () => {
    try {
        await namesParserUFC()
        setTimeout(() => {
            populateCollection(Fighter, eventParserUfc)
        }, 3000)
    } catch (err) {
        console.error(err)
    }
}
