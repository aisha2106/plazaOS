import { Schema, model, models, type InferSchemaType } from 'mongoose'

// Backs both admin and tenant accounts in one collection, discriminated by `role`.
const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'tenant'], required: true },

    // Tenant-only fields
    phone: { type: String },
    unitId: { type: Schema.Types.ObjectId, ref: 'Unit' },
    unitNumber: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },

    accountStatus: { type: String, enum: ['temporary', 'active'], required: true, default: 'active' },
    mustChangePassword: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
)

userSchema.index({ role: 1 })
userSchema.index({ unitId: 1 })

export type UserDoc = InferSchemaType<typeof userSchema>
export const User = models.User ?? model('User', userSchema)
