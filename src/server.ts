import dotenv from 'dotenv'

import app from './app'
import { connectDB } from './utils/helpers'

process.on('uncaughtException', (err: NodeJS.ErrnoException) => {
    console.log(err.name, err.message)
    console.log('UNCAUGHT EXCEPTION! Shutting down...')
    process.exit(1)
})

dotenv.config()
const port = process.env.PORT || 3000

connectDB()

const server = app.listen(port, () => {
    connectDB()
    console.log(`Server is running on port:${port}`)
})

process.on('unhandledRejection', (err: NodeJS.ErrnoException) => {
    console.log(err.name, err.message)
    console.log('UNHANDLED REJECTION! Shutting down...')
    server.close(() => process.exit(1))
})
