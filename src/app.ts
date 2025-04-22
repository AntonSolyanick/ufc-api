import express, { Express, Request, Response } from 'express'

import Fighter from './model/fighterModel'
import fighterRouter from './routes/fighterRoutes'

const app: Express = express()

app.use('/api', fighterRouter)
app.get('/', (req: Request, res: Response) => {
    res.send('test response')
})

export default app
