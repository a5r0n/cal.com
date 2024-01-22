import type { Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

import { WEBAPP_URL } from "@calcom/lib/constants";
import { CredentialRepository } from "@calcom/lib/server/repository/credential";

import checkSession from "../../_utils/auth";
import { initVitalClient, vitalEnv } from "../lib/client";

/**
 * This is will generate a user token for a client_user_id`
 * @param req
 * @param res
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = checkSession(req);
  // Get user id
  const calcomUserId = session.user.id;

  const vitalClient = await initVitalClient();

  if (!vitalClient || !vitalEnv)
    return res.status(400).json({ message: "Missing vital client, try calling `initVitalClient`" });

  // Create a user on vital
  let userVital;
  try {
    userVital = await vitalClient.User.create(`cal_${calcomUserId}`);
  } catch (e) {
    userVital = await vitalClient.User.resolve(`cal_${calcomUserId}`);
  }

  try {
    if (userVital?.user_id) {
      await CredentialRepository.create({
        type: "vital_other",
        key: { userVitalId: userVital.user_id } as unknown as Prisma.InputJsonObject,
        userId: calcomUserId,
        profileId: session.user.profile.id,
        appId: "vital-automation",
      });
    }
    const token = await vitalClient.Link.create(
      userVital?.user_id,
      undefined,
      `${WEBAPP_URL}/api/integrations/vital/callback`
    );
    return res.status(200).json({
      token: token.link_token,
      url: `https://link.tryvital.io/?env=${vitalEnv.mode}&region=${vitalEnv.region}`,
    });
  } catch (e) {
    return res.status(400).json({ error: JSON.stringify(e) });
  }
}
