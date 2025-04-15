import express, { Express, Request, Response } from 'express'

import Fighter from './model/fighterModel'
import { runParsers } from './utils/parsersUFC'
import { INTERVAL_DURATION } from './config'
import fighterRouter from './routes/fighterRoutes'

const app: Express = express()

app.use('/api', fighterRouter)
app.get('/', (req: Request, res: Response) => {
    res.send('test response')
})

export default app
