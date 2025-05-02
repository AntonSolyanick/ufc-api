import { UserDocument } from './model/userModel'

declare module 'express' {
    export interface Request {
        user?: UserDocument
    }
}
