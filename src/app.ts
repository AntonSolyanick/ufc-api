import express, { Express, Request, Response } from 'express'

import Fighter from './model/fighterModel'
import { runParsers } from './utils/parsersUFC'
import { INTERVAL_DURATION } from './config'
import fighterRouter from './routes/fighterRoutes'

const app: Express = express()

//run parsers and write data to database
;(async () => {
    try {
        await runParsers()

        setInterval(async () => {
            await Fighter.deleteMany({})
            await runParsers()
        }, INTERVAL_DURATION)
    } catch (err) {
        console.error(err)
    }
})()

app.use('/api', fighterRouter)
app.get('/', (req: Request, res: Response) => {
    res.send('test response')
})

export default app
