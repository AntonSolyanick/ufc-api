import express from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import ExpressMongoSanitize from 'express-mongo-sanitize'
import rateLimit from 'express-rate-limit'
import { filterXSS } from 'xss'
import hpp from 'hpp'
import compression from 'compression'

import fighterRouter from './routes/fighterRoutes'
import userRouter from './routes/userRoutes'
import mongoose from 'mongoose'
import { connectDB } from './utils/helpers'

const app = express()

app.set('trust proxy', 1) // для корректной работы прокси (Vercel)

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'none'"], // По умолчанию запрещаем всё
                scriptSrc: ["'self'", "'unsafe-eval'", "'wasm-unsafe-eval'"], // Для современных веб-приложений
                styleSrc: ["'self'", "'unsafe-inline'"], // Разрешаем инлайновые стили
                imgSrc: ["'self'", 'data:', 'blob:'],
                connectSrc: ["'self'", 'https://api.yourdomain.com'],
                fontSrc: ["'self'"],
                formAction: ["'self'"],
                frameAncestors: ["'none'"], // Защита от clickjacking
                objectSrc: ["'none'"], // Запрещаем Flash и другие плагины
                baseUri: ["'self'"],
            },
            reportOnly: false, // true для мониторинга без блокировки
        },

        hsts: {
            maxAge: 63072000,
            includeSubDomains: true,
            preload: true,
        },

        frameguard: { action: 'deny' }, // Запрещаем встраивание в iframe
        xssFilter: true, // Встроенная защита от XSS в браузерах
        noSniff: true, // Запрещаем MIME-sniffing
        ieNoOpen: true, // Защита для IE8+
        hidePoweredBy: true, // Удаляем X-Powered-By
        referrerPolicy: { policy: 'no-referrer-when-downgrade' },

        crossOriginResourcePolicy: { policy: 'same-site' },
        crossOriginOpenerPolicy: { policy: 'same-origin' },
        crossOriginEmbedderPolicy: { policy: 'require-corp' },
        permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    })
)

const limiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try later',
    validate: {
        trustProxy: false, // Явно отключаем доверие к прокси для rate-limit
    },
    keyGenerator: (req) => {
        // Берем IP из последнего доверенного прокси (Vercel)
        const forwarded: any = req.headers['x-forwarded-for']
        const ip = forwarded ? forwarded.split(',')[0] : req.ip
        return ip
    },
})

app.use('/api', limiter)

app.use(express.json())
app.use(cookieParser())

app.use(ExpressMongoSanitize())

const xssOptions = {
    whiteList: {}, // Пустой объект - запрещаем все HTML-теги
    stripIgnoreTag: true, // Полностью удаляем запрещённые теги
}
app.use((req, res, next) => {
    if (req.body) {
        req.body = JSON.parse(filterXSS(JSON.stringify(req.body), xssOptions))
    }
    next()
})

app.use(
    hpp({
        whitelist: [
            'duration',
            'ratingsQuantity',
            'ratingsAverage',
            'maxGroupSize',
            'difficulty',
            'price',
        ],
    })
)
app.use(compression())

app.use('/api', fighterRouter)
app.use('/api/users', userRouter)

app.use('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'API работает',
        dbStatus:
            mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
    })
})

export default app
