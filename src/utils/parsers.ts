import { Model } from 'mongoose'

import Fighter from '../model/fighterModel'
import Event from '../model/eventModel'
import { getBrowserPage } from './helpers'
import { fighterDocument } from '../model/fighterModel'
import { eventDocument } from '../model/eventModel'

const namesParser: Function = async (url: string) => {
    const [page, browser] = await getBrowserPage(url)

    let fightersNames = await page.evaluate(() => {
        let fightersInfo: Element[] = []
        const tableContainer = Array.from(document.querySelectorAll('tbody'))
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
}

const eventParserUfc: Function = async (url: string) => {
    const [page, browser] = await getBrowserPage(url)

    const nextFightInfo = await page.evaluate(() => {
        const nextFightContainer = document.querySelector(
            '.c-card-event--upcoming'
        )
        const nextFightHeadline: HTMLElement =
            nextFightContainer?.querySelector(
                '.c-card-event--athlete-fight__headline'
            )!

        const firstFighter = nextFightHeadline?.innerText?.split('VS')[0]
        const secondFighter = nextFightHeadline?.innerText?.split('VS')[1]
        const fightDate = nextFightContainer?.querySelector(
            '.c-card-event--athlete-fight__date'
        )?.textContent
        const firstFighterRusName = document.querySelector(
            '.hero-profile__name'
        )?.textContent

        return [
            {
                firstFighter,
                secondFighter,
                fightDate,
            },
            firstFighterRusName,
        ]
    })

    browser.close()
    const [info, firstFighterRusName] = nextFightInfo

    if (Object.keys(info).length === 0) {
        return firstFighterRusName
    }

    await Event.create(info)
    return firstFighterRusName
}

const populateCollections: Function = async (
    Model: Model<eventDocument>,
    eventParser: Function,
    eventsUrl: string
) => {
    const fighters: fighterDocument[] = await Model.find()

    for (let i = 0; i < fighters.length; i++) {
        let firstFighterRusName = await eventParser(
            `${eventsUrl}${fighters[i].slug}`
        )

        if (!firstFighterRusName) continue
        await Model.findOneAndUpdate(
            { slug: fighters[i].slug },
            { rusName: firstFighterRusName }
        )
    }
}

export const runParsers = async (namesUrl: string, eventsUrl: string) => {
    await namesParser(namesUrl)
    setTimeout(() => {
        populateCollections(Fighter, eventParserUfc, eventsUrl)
    }, 3000)
}
