import type { FastifyRequest, FastifyReply } from "fastify";
import { errorResponse } from "../utils/response";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      sub: string;
      email: string;
      name: string;
      role: string;
      department?: string;
    };
  }
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
    // Attach decoded payload to request.user
    const decoded = request.user as Record<string, unknown>;
    request.user = {
      sub: decoded.sub as string,
      email: decoded.email as string,
      name: decoded.name as string,
      role: decoded.role as string,
      department: decoded.department as string | undefined,
    };
  } catch (err) {
    errorResponse(reply, 401, "UNAUTHORIZED", "Invalid or expired token. Please log in again.");
  }
}

export function requireRole(allowedRoles: string[]) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    await requireAuth(request, reply);
    if (!request.user) return; // already sent error response

    if (!allowedRoles.includes(request.user.role)) {
      errorResponse(
        reply,
        403,
        "FORBIDDEN",
        `Access denied. Required role(s): ${allowedRoles.join(", ")}`
      );
    }
  };
}
