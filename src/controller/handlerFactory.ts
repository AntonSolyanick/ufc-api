import mongoose, { Model, PopulateOptions } from 'mongoose'
import { catchAsync } from '../utils/catchAsync'
import { APIFeatures } from '../utils/APIFeatures'

export const getAll = <T extends mongoose.Document>(Model: Model<T>) =>
    catchAsync(async (req, res, next) => {
        let filter = {}
        if (req.params.id) filter = { id: req.params.id }
        const features = new APIFeatures(Model.find(), req.query).paginate()
        const document = await features.query
        res.status(200).json({
            status: 'success',
            result: document.length,
            body: {
                data: document,
            },
        })
    })

export const getOne = <T extends mongoose.Document>(
    Model: Model<T>,
    popOptions?: PopulateOptions
) =>
    catchAsync(async (req, res, next) => {
        let query = Model.findById(req.params.id)
        if (popOptions) query = query.populate(popOptions)
        const document = await query
        if (!document) {
            throw new Error("Can't find document with this ID")
        }
        res.status(200).json({
            status: 'success',
            data: { document },
        })
    })
