import mongoose from 'mongoose'
import validator from 'validator'
import { Types } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface UserDocument extends mongoose.Document {
    _id: Types.ObjectId
    name: string
    password: string
    email: string
    confirmPassword: string
    passwordChangedAt: Date
    passwordResetToken: string
    passwordResetExpires: Date
    active: {
        type: boolean
        default: boolean
        select: boolean
    }
    correctPassword(password: string, userPassword: string): Promise<boolean>
}

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please, input your name!'],
    },
    email: {
        type: String,
        required: [true, 'Please, input your email!'],
        unique: true,
        lowerCase: true,
        validate: [validator.isEmail, 'Please input a valid email!'],
    },
    password: {
        type: String,
        required: [true, 'Please, input your password!'],
    },
    confirmPassword: {
        type: String,
        required: [true, 'Please provide your password!'],
        validate: {
            validator: function (this: UserDocument, val: string): boolean {
                return val === this.password
            },
            message: 'Passwords are not the same!',
        },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
})

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next()

    this.password = await bcrypt.hash(this.password, 12)
    this.confirmPassword = ''
    next()
})

UserSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next()
    this.passwordChangedAt = new Date(Date.now() - 1000)
    next()
})

UserSchema.methods.correctPassword = async function (
    candidatePassword: string,
    userPassword: string
) {
    return await bcrypt.compare(candidatePassword, userPassword)
}

const User = mongoose.model<UserDocument>('users', UserSchema)
export default User
