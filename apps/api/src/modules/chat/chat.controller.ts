import type { Request, Response } from 'express';
import * as chatService from './chat.service.js';
import type { SendChatMessageInput } from './chat.schemas.js';

export async function listChatMessagesHandler(req: Request, res: Response): Promise<void> {
  const messages = await chatService.listMessages(req.user!);
  res.status(200).json({ messages });
}

export async function sendChatMessageHandler(req: Request, res: Response): Promise<void> {
  const message = await chatService.sendMessage(req.user!, req.body as SendChatMessageInput);
  res.status(201).json({ message });
}
