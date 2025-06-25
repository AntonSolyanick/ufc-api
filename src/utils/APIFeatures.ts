import { Document, Query } from 'mongoose'
interface QueryString {
    page?: number | string
    limit?: number | string
    sort?: string
    fields?: string
}

export class APIFeatures<T extends Document> {
    query: Query<T[], T>
    private queryString: QueryString

    constructor(query: Query<T[], T>, queryString: QueryString) {
        this.query = query
        this.queryString = queryString
    }

    filter() {
        const queryObj = { ...(this.queryString as Record<string, unknown>) }
        const excludedFields = ['page', 'sort', 'limit', 'fields']
        excludedFields.forEach((el) => delete queryObj[el])

        Object.entries(queryObj).forEach(([key, value]) => {
            if (typeof value === 'string') {
                queryObj[key] = {
                    $regex: value,
                    $options: 'i',
                }
            }
        })

        let queryString = JSON.stringify(queryObj)
        queryString = queryString.replace(
            /\b(gte|gt|lte|lt)\b/g,
            (match) => `$${match}`
        )

        this.query = this.query.find(JSON.parse(queryString))
        return this
    }

    paginate() {
        const page = Number(this.queryString.page) || 1
        const limit = Number(this.queryString.limit) || 20
        const skip = (page - 1) * limit

        this.query = this.query.skip(skip).limit(limit)
        return this
    }
}
