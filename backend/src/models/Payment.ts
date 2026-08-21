import { Schema, model, models, type InferSchemaType } from 'mongoose'

const paymentSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tenantName: { type: String, required: true },
    unitId: { type: Schema.Types.ObjectId, ref: 'Unit' },
    unitNumber: { type: String, required: true },
    // The rent obligation this transaction is for — required for gateway payments
    // (see backend/src/app/api/tenant/payments/route.ts); offline payments don't
    // link one yet (see BACKEND_BUILD_PLAN.md §7's "admin offline payments" item).
    rentChargeId: { type: Schema.Types.ObjectId, ref: 'RentCharge' },
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
paymentSchema.index({ rentChargeId: 1 })

export type PaymentDoc = InferSchemaType<typeof paymentSchema>
export const Payment = models.Payment ?? model('Payment', paymentSchema)
