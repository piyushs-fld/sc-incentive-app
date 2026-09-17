import { Redis } from "@upstash/redis";

/* Server-side only. Credentials come from the environment and are never sent to
   the client; all browser access goes through /api/config. */
export const redis = Redis.fromEnv();

/** Single key holding the complete active policy configuration. */
export const CONFIG_KEY = "sc:incentive:policy:active";
