import { getAdminDb } from '../config/firebase.js';

export interface CreatorMessageInput {
  clientName: string;
  email: string;
  message: string;
  customRequest: boolean;
}

export async function createCreatorMessage(uid: string, data: CreatorMessageInput) {
  const db = getAdminDb();
  const ref = db.collection('creator_messages').doc();

  await ref.set({
    uid,
    clientName: data.clientName.trim(),
    email: data.email.trim(),
    message: data.message.trim(),
    customRequest: Boolean(data.customRequest),
    createdAt: new Date().toISOString(),
  });

  return { id: ref.id };
}
