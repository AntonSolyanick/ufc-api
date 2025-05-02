import { Request, Response, NextFunction, RequestHandler } from 'express'

interface AppError extends Error {
    statusCode?: number
    status?: string
    isOperational?: boolean
}

export const catchAsync = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch((err: AppError) => {
            err.statusCode = err.statusCode || 500
            err.status = err.status || 'error'
            next(err)
        })
    }
}
