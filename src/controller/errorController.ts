import { Request, Response, NextFunction } from 'express'

export const globalErrorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0]
        const message =
            field === 'login'
                ? 'Этот логин уже занят'
                : field === 'email'
                  ? 'Этот email уже используется'
                  : 'Запись с такими данными уже существует'

        res.status(409).json({ status: 'fail', message })
        return
    }

    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((error: any) => {
            switch (error.path) {
                case 'confirmPassword':
                    return 'Пароли не совпадают'
                case 'password':
                    return error.message || 'Некорректный пароль'
                case 'login':
                    return error.message || 'Некорректный логин'
                case 'email':
                    return error.message || 'Некорректный email'
                default:
                    return error.message || `Ошибка в поле ${error.path}`
            }
        })

        const message = errors[0] || 'Некорректные данные'

        res.status(400).json({
            status: 'fail',
            message,
            ...(process.env.NODE_ENV === 'development' && { errors }),
        })
        return
    }

    const statusCode = err.statusCode || 500

    if (process.env.NODE_ENV === 'development') {
        res.status(statusCode).json({
            status: 'error',
            message: err.message,
            stack: err.stack,
            error: err,
        })
    } else {
        res.status(statusCode).json({
            status: 'error',
            message: err.isOperational
                ? err.message
                : 'Внутренняя ошибка сервера',
        })
    }
}
