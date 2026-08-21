import { Schema, model, models, type InferSchemaType } from 'mongoose'

const announcementSchema = new Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    important: { type: Boolean, required: true, default: false },
    audience: { type: String, enum: ['all', 'selected'], required: true, default: 'all' },
    audienceTenantIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    author: { type: String, required: true },
  },
  { timestamps: true },
)

announcementSchema.index({ createdAt: -1 })

export type AnnouncementDoc = InferSchemaType<typeof announcementSchema>
export const Announcement = models.Announcement ?? model('Announcement', announcementSchema)
