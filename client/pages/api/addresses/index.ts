import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { db } from "@/lib/db"; // adjust path to your DB client

/** GET – list saved addresses for the current user */
export async function GET(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthenticated" });
  }

  const addresses = await db.address.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return res.status(200).json(addresses);
}

/** POST – create a new address for the current user */
export async function POST(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthenticated" });
  }

  const {
    label,
    line1,
    line2,
    city,
    state,
    zip,
    country,
  }: {
    label: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  } = req.body;

  const newAddress = await db.address.create({
    data: {
      label,
      line1,
      line2,
      city,
      state,
      zip,
      country,
      userId: session.user.id,
    },
  });

  return res.status(201).json(newAddress);
}
