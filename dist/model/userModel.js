"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const validator_1 = __importDefault(require("validator"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, 'Please, input your name!'],
    },
    login: {
        type: String,
        required: [true, 'Please, input your login!'],
        unique: true,
        lowerCase: true,
    },
    email: {
        type: String,
        // required: [true, 'Please, input your email!'],
        unique: true,
        lowerCase: true,
        validate: [validator_1.default.isEmail, 'Please input a valid email!'],
    },
    password: {
        type: String,
        required: [true, 'Please, input your password!'],
    },
    confirmPassword: {
        type: String,
        required: [true, 'Please confirm your password!'],
        validate: {
            validator: function (val) {
                return val === this.password;
            },
            message: 'Passwords are not the same!',
        },
    },
    favouriteFighters: [
        {
            type: mongoose_1.default.Schema.ObjectId,
            ref: 'Fighter',
        },
    ],
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
});
userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});
userSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'favouriteFighters',
    });
    next();
});
userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    this.confirmPassword = '';
    this.password = await bcryptjs_1.default.hash(this.password, 12);
    next();
});
userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew)
        return next();
    this.passwordChangedAt = new Date(Date.now() - 1000);
    next();
});
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcryptjs_1.default.compare(candidatePassword, userPassword);
};
const User = mongoose_1.default.model('users', userSchema);
exports.default = User;
