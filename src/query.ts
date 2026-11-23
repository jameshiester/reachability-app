import type { Request } from "express";

export const getQueryString = (
  request: Request,
  name: string,
): string | undefined => {
  const value = request.query[name];
  return typeof value === "string" ? value : undefined;
};
