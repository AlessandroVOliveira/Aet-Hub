import type { Request, Response } from 'express';
import * as directMessagesService from './direct-messages.service.js';
import type { SendDirectMessageInput } from './direct-messages.schemas.js';

export async function listConversationsHandler(req: Request, res: Response): Promise<void> {
  const conversations = await directMessagesService.listConversations(req.user!);
  res.status(200).json({ conversations });
}

export async function listDirectMessagesHandler(req: Request, res: Response): Promise<void> {
  // req.params.userId é tipado string | string[] pelo ParamsDictionary do
  // Express mesmo numa rota simples /:userId (ver CLAUDE.md) — cast direto
  // em vez de tipar o handler com Request<{ userId: string }>, que
  // conflitaria com a assinatura fixa do asyncHandler.
  const messages = await directMessagesService.listMessagesWith(
    req.user!,
    req.params.userId as string,
  );
  res.status(200).json({ messages });
}

export async function sendDirectMessageHandler(req: Request, res: Response): Promise<void> {
  const message = await directMessagesService.sendMessage(
    req.user!,
    req.params.userId as string,
    req.body as SendDirectMessageInput,
  );
  res.status(201).json({ message });
}
