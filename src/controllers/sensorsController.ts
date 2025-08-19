import { Request, Response } from "express";
import prisma from "../lib/db";

export async function getSensors(req: Request, res: Response) {
  try {
    const sensors = await prisma.sensor.findMany();
    res.json(sensors);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sensors" });
  }
}

export async function createSensor(req: Request, res: Response) {
  try {
    const sensor = await prisma.sensor.create({
      data: req.body,
    });
    res.status(201).json(sensor);
  } catch (error) {
    res.status(500).json({ error: "Failed to create sensor" });
  }
}
