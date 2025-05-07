"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mutateArray = exports.getOne = exports.getAll = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const APIFeatures_1 = require("../utils/APIFeatures");
const getAll = (Model) => (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    let filter = {};
    if (req.params.id)
        filter = { id: req.params.id };
    const features = new APIFeatures_1.APIFeatures(Model.find(), req.query).paginate();
    const document = await features.query;
    res.status(200).json({
        status: 'success',
        result: document.length,
        body: {
            data: document,
        },
    });
});
exports.getAll = getAll;
const getOne = (Model, popOptions) => (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions)
        query = query.populate(popOptions);
    const document = await query;
    if (!document) {
        throw new Error("Can't find document with this ID");
    }
    res.status(200).json({
        status: 'success',
        data: { document },
    });
});
exports.getOne = getOne;
const mutateArray = (actionType, Model, arrayName) => (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    let updateOperator;
    if (actionType === 'delete')
        updateOperator = '$pull';
    if (actionType === 'add')
        updateOperator = '$addToSet';
    const updatedDocument = await Model.findByIdAndUpdate(req.params.id, {
        [updateOperator]: { [arrayName]: req.body.element },
    }, { new: true, runValidators: true });
    if (!updatedDocument) {
        throw new Error("Can't find document");
    }
    res.status(200).json({
        status: 'success',
        data: { updatedDocument },
    });
});
exports.mutateArray = mutateArray;
