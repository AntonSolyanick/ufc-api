"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const xss_1 = require("xss");
const hpp_1 = __importDefault(require("hpp"));
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const fighterRoutes_1 = __importDefault(require("./routes/fighterRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.set('trust proxy', 1); // для корректной работы прокси (Vercel)
app.use((0, helmet_1.default)({
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
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try later',
    validate: {
        trustProxy: false,
    },
    keyGenerator: (req) => {
        const forwarded = req.headers['x-forwarded-for'];
        if (typeof forwarded === 'string') {
            return forwarded.split(',')[0].trim();
        }
        if (Array.isArray(forwarded)) {
            return forwarded[0].trim();
        }
        return req.ip;
    },
});
app.use('/api', limiter);
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, express_mongo_sanitize_1.default)());
const xssOptions = {
    whiteList: {}, // Пустой объект - запрещаем все HTML-теги
    stripIgnoreTag: true, // Полностью удаляем запрещённые теги
};
app.use((req, res, next) => {
    if (req.body) {
        req.body = JSON.parse((0, xss_1.filterXSS)(JSON.stringify(req.body), xssOptions));
    }
    next();
});
app.use((0, hpp_1.default)({
    whitelist: [
        'duration',
        'ratingsQuantity',
        'ratingsAverage',
        'maxGroupSize',
        'difficulty',
        'price',
    ],
}));
app.use((0, compression_1.default)());
app.use('/api', fighterRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'API работает',
    });
});
exports.default = app;
