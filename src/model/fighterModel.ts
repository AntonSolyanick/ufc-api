import mongoose from 'mongoose'
import slugify from 'slugify'

export interface fighterDocument extends mongoose.Document {
    name: string
    rusName: string
    slug: string
}

const fighterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'a fighter must have a name'],
        unique: false,
    },
    rusName: {
        type: String,
        trim: true,
        default: '',
    },
    slug: {
        type: String,
    },
})

fighterSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true })
    next()
})

fighterSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'event',
        select: 'firstFighter',
        strictPopulate: false,
    })
    next()
})

const Fighter = mongoose.model<fighterDocument>('Fighter', fighterSchema)

export default Fighter
