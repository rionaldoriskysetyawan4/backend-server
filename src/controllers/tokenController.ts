import { Request, Response } from "express";
import { findToken, createToken, deleteToken } from "../models/tokenModel";

export async function getToken(req: Request, res: Response) {
  const { token } = req.params;
  try {
    const found = await findToken(token);
    if (!found) return res.status(404).json({ error: "Token not found" });
    res.json(found);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch token" });
  }
}

export async function addToken(req: Request, res: Response) {
  try {
    const created = await createToken(req.body);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: "Failed to create token" });
  }
}

export async function removeToken(req: Request, res: Response) {
  const { token } = req.params;
  try {
    const deleted = await deleteToken(token);
    if (!deleted) return res.status(404).json({ error: "Token not found" });
    res.json(deleted);
  } catch (error) {
    res.status(500).json({ error: "Failed to delete token" });
  }
}
