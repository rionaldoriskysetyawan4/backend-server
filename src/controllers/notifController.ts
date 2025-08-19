import { Request, Response } from "express";
import prisma from "../lib/db";

export async function getNotifications(req: Request, res: Response) {
  try {
    const notifications = await prisma.notification.findMany();
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
}

export async function createNotification(req: Request, res: Response) {
  try {
    const notification = await prisma.notification.create({
      data: req.body,
    });
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: "Failed to create notification" });
  }
}
