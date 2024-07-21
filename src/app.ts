import express, { Express, Request, Response } from 'express'

import Fighter from './model/fighterModel'
import { runParsers } from './utils/parsersUFC'
import { INTERVAL_DURATION } from './config'
import { getAllFighters } from './controller/fighterController'
import fighterRouter from './routes/fighterRoutes'
const app: Express = express()

//run parsers and write data to database

;(async () => {
    await runParsers()

    setInterval(async () => {
        await Fighter.deleteMany({})
        await runParsers()
    }, INTERVAL_DURATION)
})()

app.use('/api', fighterRouter)

app.get('/fighters', getAllFighters)

app.get('/', (req: Request, res: Response) => {
    res.send('response')
})

export default app
