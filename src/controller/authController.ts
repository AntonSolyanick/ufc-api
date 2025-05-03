import { Email } from '../utils/email'
import { Request, Response, NextFunction } from 'express'
import { Types } from 'mongoose'
import jwt, { VerifyErrors } from 'jsonwebtoken'
import User from '../model/userModel'
import { UserDocument } from '../model/userModel'
import { catchAsync } from '../utils/catchAsync'

interface JwtPayload {
    id: string
    iat?: number
}

interface CookieOptions {
    httpOnly: boolean
    expires?: Date
    secure?: boolean
}

interface ApiResponse {
    status: 'success' | 'fail' | 'error'
    token?: string
    data?: {
        user: Partial<UserDocument>
    }
}

const signInToken = (id: Types.ObjectId): string => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined')
    }

    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '90d',
    } as jwt.SignOptions)
}

const createSendToken = (
    user: UserDocument,
    statusCode: number,
    res: Response
): void => {
    const token = signInToken(user._id)

    const cookieOptions: CookieOptions = {
        httpOnly: true,
        expires: new Date(
            Date.now() +
                Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
        ),
    }

    if (process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true
    }

    res.cookie('jwt', token, cookieOptions)
    user.password = ''
    user.confirmPassword = ''

    const response: ApiResponse = {
        status: 'success',
        token,
        data: {
            user,
        },
    }

    res.status(statusCode).json(response)
}

export const signUp = catchAsync(async (req, res, next) => {
    const newUser = await User.create(req.body)
    const url = `${req.protocol}://${req.get('host')}/me`
    await new Email(newUser, url).sendWelcome()
    createSendToken(newUser, 201, res)
})

export const signIn = catchAsync(async (req, res, next) => {
    const { email, password } = req.body

    if (!email || !password)
        throw new Error('Please provide email and password!')
    const user = await User.findOne({ email }).select('+password')
    if (!user || !(await user.correctPassword(password, user.password!))) {
        throw new Error('Wrong email or password!')
    }
    createSendToken(user, 200, res)
})

export const signOut = catchAsync(async (req, res, next) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    })
    res.status(200).json({ status: 'success' })
})

export const isSignedIn = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const token = req.cookies?.jwt

    if (!token) return next()

    try {
        const decoded = await new Promise<JwtPayload>((resolve, reject) => {
            jwt.verify(
                token,
                process.env.JWT_SECRET as string,
                (err: VerifyErrors | null, decoded: unknown) => {
                    if (err) {
                        return reject(err)
                    }
                    if (
                        !decoded ||
                        typeof decoded !== 'object' ||
                        !('id' in decoded)
                    ) {
                        return reject(new Error('Invalid token payload'))
                    }
                    resolve(decoded as JwtPayload)
                }
            )
        })

        const user = await User.findById(decoded.id)
        if (!user) return next()

        // if (user.changedPasswordAfter(decoded.iat)) {
        //     return next()
        // }
        req.user = user
        res.locals.user = user
        next()
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error('JWT verification error:', err.message)
        }
        next()
    }
}

interface JwtPayload {
    id: string
    iat?: number
}

export const protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check of it's there
    let token
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1]
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt
    }

    if (!token) {
        return next(
            new Error('You are not logged in! Please log in to get access.')
        )
    }

    // 2) Verification token
    const decoded = await new Promise<JwtPayload>((resolve, reject) => {
        jwt.verify(
            token as string,
            process.env.JWT_SECRET as string,
            (err, decoded) => {
                if (err) return reject(err)
                resolve(decoded as JwtPayload)
            }
        )
    })

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id)
    if (!currentUser) {
        return next(
            new Error('The user belonging to this token does no longer exist.')
        )
    }

    // 4) Check if user changed password after the token was issued
    // if (currentUser.changedPasswordAfter(decoded.iat)) {
    //   return next(
    //     new AppError('User recently changed password! Please log in again.', 401)
    //   );
    // }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser
    res.locals.user = currentUser
    next()
})
