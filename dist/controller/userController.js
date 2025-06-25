"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFavouriteFighter = exports.addFavouriteFighter = exports.getMe = exports.getUser = exports.getAllUsers = void 0;
const userModel_1 = __importDefault(require("../model/userModel"));
const factory = __importStar(require("./handlerFactory"));
exports.getAllUsers = factory.getAll(userModel_1.default);
exports.getUser = factory.getOne(userModel_1.default);
const getMe = (req, res, next) => {
    if (!req.user) {
        return next(new Error('User not authenticated'));
    }
    req.params.userId = req.user._id.toString();
    next();
};
exports.getMe = getMe;
exports.addFavouriteFighter = factory.mutateArray('add', userModel_1.default, 'favouriteFighters');
exports.deleteFavouriteFighter = factory.mutateArray('delete', userModel_1.default, 'favouriteFighters');
