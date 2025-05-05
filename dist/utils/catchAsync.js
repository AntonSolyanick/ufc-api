"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsync = void 0;
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch((err) => {
            err.statusCode = err.statusCode || 500;
            err.status = err.status || 'error';
            next(err);
        });
    };
};
exports.catchAsync = catchAsync;
