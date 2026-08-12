import { Schema, model, models, type InferSchemaType } from 'mongoose'

const reminderSchema = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['automatic', 'manual'], required: true },
    target: { type: String, enum: ['tenant', 'group', 'everyone'], required: true },
    targetTenantIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    targetLabel: { type: String, required: true },
    scheduledFor: { type: String, required: true },
    status: { type: String, enum: ['scheduled', 'sent', 'failed'], required: true, default: 'scheduled' },
  },
  { timestamps: true },
)

reminderSchema.index({ status: 1, scheduledFor: 1 })

export type ReminderDoc = InferSchemaType<typeof reminderSchema>
export const Reminder = models.Reminder ?? model('Reminder', reminderSchema)
