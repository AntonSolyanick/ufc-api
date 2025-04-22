import mongoose from 'mongoose'
import slugify from 'slugify'

type NextFightInfo = {
    firstFighterName: string
    secondFighterName: string
    fightDate: string
    firstFighterSmallImg: string
    secondFighterSmallImg: string
}
export type FighterRecord = {
    wins?: number
    draws?: number
    loses?: number
}

export interface FighterDocument extends mongoose.Document {
    name: string
    fighterRusName: string
    fighterImage: string
    slug: string
    fighterRating: number
    fighterWeightCategory: string
    fighterRecord: FighterRecord
    nextFightInfo: NextFightInfo
}

const fighterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'a fighter must have a name'],
        unique: false,
    },
    fighterRusName: {
        type: String,
        trim: true,
        default: '',
    },
    slug: {
        type: String,
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
})

fighterSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true })
    next()
})

const Fighter = mongoose.model<FighterDocument>('Fighter', fighterSchema)

export default Fighter
