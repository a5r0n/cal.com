import type { NextApiRequest, NextApiResponse } from "next";

import { CredentialRepository } from "@calcom/lib/server/repository/credential";
import prisma from "@calcom/prisma";

import config from "../config.json";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!req.session?.user?.id) {
    return res.status(401).json({ message: "You must be logged in to do this" });
  }
  const appType = config.type;
  try {
    const alreadyInstalled = await prisma.credential.findFirst({
      where: {
        type: appType,
        userId: req.session.user.id,
      },
    });
    if (alreadyInstalled) {
      throw new Error("Already installed");
    }
    const installation = await CredentialRepository.create({
      type: appType,
      key: {},
      userId: req.session.user.id,
      profileId: req.session.user.profile.id,
      appId: "alby",
    });

    if (!installation) {
      throw new Error("Unable to create user credential for Alby");
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }
    return res.status(500);
  }

  return res.status(200).json({ url: "/apps/alby/setup" });
}
