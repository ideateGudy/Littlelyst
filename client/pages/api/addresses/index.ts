import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Simple mock API for addresses.
 * Returns an empty list for GET and echoes the posted address for POST.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // No real DB – return an empty array or demo data.
    res.status(200).json([]);
    return;
  }
  if (req.method === "POST") {
    const address = req.body;
    // Echo back with a temporary id.
    res.status(201).json({ ...address, id: `tmp-${Date.now()}` });
    return;
  }
  // Method not allowed.
  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
