import { Schema, model, models, type InferSchemaType } from 'mongoose'

// One collection for both roles' feeds — `audience` distinguishes the two,
// so /tenant/notifications and /admin/notifications are simple filtered queries.
const notificationSchema = new Schema(
  {
    audience: { type: String, enum: ['admin', 'tenant'], required: true },
    // Omitted for a broadcast notification to "all admins"/"all tenants".
    recipientId: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: ['payment', 'maintenance', 'announcement', 'appointment', 'reminder'],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String },
    date: { type: String, required: true },
    read: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
)

notificationSchema.index({ audience: 1, recipientId: 1, read: 1, date: -1 })

export type NotificationDoc = InferSchemaType<typeof notificationSchema>
export const Notification = models.Notification ?? model('Notification', notificationSchema)
