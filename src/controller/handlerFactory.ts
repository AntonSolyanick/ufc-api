import mongoose, { Model, PopulateOptions } from 'mongoose'
import { catchAsync } from '../utils/catchAsync'
import { APIFeatures } from '../utils/APIFeatures'
import { UserDocument } from '../model/userModel'

export const getAll = <T extends mongoose.Document>(Model: Model<T>) =>
    catchAsync(async (req, res, next) => {
        let filter = {}
        if (req.params.fighterRusName)
            filter = { fighterRusName: req.params.fighterRusName }
        const features = new APIFeatures(Model.find(filter), req.query)
            .filter()
            .paginate()
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
        let query = Model.findById(req.params.userId)
        if (popOptions) query = query.populate(popOptions)
        const document = await query
        if (!document) {
            throw new Error("Can't find document with this ID")
        }
        res.status(200).json({
            status: 'success',
            document,
        })
    })

export const mutateArray = <T extends mongoose.Document>(
    actionType: string,
    Model: Model<T>,
    arrayName: string
) =>
    catchAsync(async (req, res, next) => {
        let updateOperator: any
        if (actionType === 'delete') updateOperator = '$pull'
        if (actionType === 'add') updateOperator = '$addToSet'

        const updatedDocument = (await Model.findByIdAndUpdate(
            req.params.userId,
            {
                [updateOperator]: { [arrayName]: req.body.itemId },
            },
            { new: true, runValidators: true }
        )) as UserDocument

        if (!updatedDocument) {
            throw new Error("Can't find document")
        }

        res.status(200).json({
            status: 'success',
            data: { updatedDocument },
        })
    })
