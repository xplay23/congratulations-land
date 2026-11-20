import { getPayload as getPayloadLocal } from "payload";
import configPromise from "@payload-config";

/**
 * Gets the initialized Payload CMS instance.
 */
export const getPayload = async () => {
  return getPayloadLocal({
    config: configPromise,
  });
};
