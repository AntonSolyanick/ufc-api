import express, { Request, Response } from 'express'
import cookieParser from 'cookie-parser'

import fighterRouter from './routes/fighterRoutes'
import userRouter from './routes/userRoutes'

const app = express()

app.use(express.json())
app.use(cookieParser())

app.use('/api', fighterRouter)
app.use('/api/users', userRouter)

export default app
