import { Request, Response, NextFunction } from 'express'

import Fighter from '../model/fighterModel'

export const getAllFighters = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const fighters = await Fighter.find()
        res.status(200).json({
            status: 'success',
            result: fighters.length,
            body: {
                data: fighters,
            },
        })
    } catch (err) {
        res.send('"Get allfighters" error')
    }
}
