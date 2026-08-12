import { Schema, model, models, type InferSchemaType } from 'mongoose'

const paymentSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tenantName: { type: String, required: true },
    unitId: { type: Schema.Types.ObjectId, ref: 'Unit' },
    unitNumber: { type: String, required: true },
    amount: { type: Number, required: true, min: 0.01 },
    method: { type: String, enum: ['cash', 'bank_transfer', 'check', 'gateway'], required: true },
    status: { type: String, enum: ['paid', 'pending', 'failed'], required: true, default: 'pending' },
    date: { type: String, required: true },
    note: { type: String },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    // Gateway payments only — the gateway's own payment/event id, used to key idempotent webhook updates.
    gatewayReference: { type: String },
  },
  { timestamps: true },
)

paymentSchema.index({ tenantId: 1 })
paymentSchema.index({ status: 1 })
paymentSchema.index({ date: 1 })
paymentSchema.index({ gatewayReference: 1 })

export type PaymentDoc = InferSchemaType<typeof paymentSchema>
export const Payment = models.Payment ?? model('Payment', paymentSchema)
