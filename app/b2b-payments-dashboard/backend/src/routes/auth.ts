import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { users, userPasswords } from "../data/users";
import { successResponse, errorResponse } from "../utils/response";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /api/v1/auth/login
  fastify.post(
    "/login",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parseResult = loginSchema.safeParse(request.body);
      if (!parseResult.success) {
        return errorResponse(
          reply,
          400,
          "VALIDATION_ERROR",
          "Invalid request body",
          parseResult.error.flatten().fieldErrors
        );
      }

      const { email, password } = parseResult.data;

      const user = users.find((u) => u.email === email);
      const storedHash = userPasswords[email];

      const passwordValid = storedHash ? await bcrypt.compare(password, storedHash) : false;
      if (!user || !passwordValid) {
        return errorResponse(reply, 401, "INVALID_CREDENTIALS", "Invalid email or password.");
      }

      const payload = {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        ...(user.department && { department: user.department }),
      };

      const token = fastify.jwt.sign(payload, { expiresIn: "8h" });

      return successResponse(reply, {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
        },
        expiresIn: "8h",
      });
    }
  );

  // GET /api/v1/auth/me
  fastify.get(
    "/me",
    {
      preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          await request.jwtVerify();
        } catch {
          return errorResponse(reply, 401, "UNAUTHORIZED", "Invalid or expired token.");
        }
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const payload = request.user as Record<string, unknown>;
      const user = users.find((u) => u.id === payload.sub);
      if (!user) {
        return errorResponse(reply, 404, "USER_NOT_FOUND", "User not found.");
      }
      return successResponse(reply, {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
      });
    }
  );
}
