import { RequestHandler, Request } from 'express'

import User from '../model/userModel'
import * as factory from './handlerFactory'

export const getAllUsers = factory.getAll(User)
export const getUser = factory.getOne(User)

export const getMe: RequestHandler = (req: Request, res, next) => {
    if (!req.user) {
        return next(new Error('User not authenticated'))
    }
    req.params.id = req.user._id.toString()
    next()
}

export const addFavouriteFighter = factory.mutateArray(
    'add',
    User,
    'favouriteFighters'
)

export const deleteFavouriteFighter = factory.mutateArray(
    'delete',
    User,
    'favouriteFighters'
)
