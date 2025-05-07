"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const fighterSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, 'a fighter must have a name'],
        unique: true,
    },
    fighterRusName: {
        type: String,
        trim: true,
        default: '',
    },
    slug: {
        type: String,
        unique: true,
        required: true,
    },
    fighterImage: {
        type: String,
    },
    fighterRating: {
        type: Number,
    },
    fighterWeightCategory: {
        type: String,
    },
    fighterRecord: {
        type: Object,
    },
    nextFightInfo: {
        type: Object,
    },
});
const Fighter = mongoose_1.default.model('Fighter', fighterSchema);
exports.default = Fighter;
