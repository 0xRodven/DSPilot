/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as coaching from "../coaching.js";
import type * as drivers from "../drivers.js";
import type * as imports from "../imports.js";
import type * as lib_timeQuery from "../lib/timeQuery.js";
import type * as seed from "../seed.js";
import type * as seed_seedCoaching from "../seed/seedCoaching.js";
import type * as stations from "../stations.js";
import type * as stats from "../stats.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  coaching: typeof coaching;
  drivers: typeof drivers;
  imports: typeof imports;
  "lib/timeQuery": typeof lib_timeQuery;
  seed: typeof seed;
  "seed/seedCoaching": typeof seed_seedCoaching;
  stations: typeof stations;
  stats: typeof stats;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
