import {
  DEFAULT_SERVER_ERROR_MESSAGE,
  createSafeActionClient,
} from "next-safe-action";
import { z } from "zod";

export class ActionError extends Error {}

export const action = createSafeActionClient({
  // You can provide a custom handler for server errors, otherwise the lib will use `console.error`
  // as the default logging mechanism and will return the DEFAULT_SERVER_ERROR_MESSAGE for all server errors.
  handleServerError: (e) => {
    console.error("Action server error occurred:", e.message);

    // If the error is an instance of `ActionError`, unmask the message.
    if (e instanceof ActionError) {
      return e.message;
    }

    // Otherwise return default error message.
    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
  // Here we define a metadata type to be used in `metadata` instance method.
  defineMetadataSchema() {
    return z.object({
      actionName: z.string(),
    });
  },
}).use(async ({ next, metadata, clientInput, bindArgsClientInputs, ctx }) => {
  // Here we use a logging middleware.
  const start = Date.now();

  // Here we await the next middleware.
  const result = await next();

  const end = Date.now();

  const durationInMs = end - start;

  const logObject: Record<string, any> = { durationInMs };

  logObject.clientInput = clientInput;
  logObject.bindArgsClientInputs = bindArgsClientInputs;
  logObject.metadata = metadata;
  logObject.result = result;

  console.log("LOGGING FROM MIDDLEWARE:");
  console.dir(logObject, { depth: null });

  // And then return the result of the awaited next middleware.
  return result;
});

async function getSessionId() {
  return crypto.randomUUID();
}

export const authAction = action
  // In this case, context is used for (fake) auth purposes.
  .use(async ({ next }) => {
    const userId = crypto.randomUUID();

    console.log("HELLO FROM FIRST AUTH ACTION MIDDLEWARE, USER ID:", userId);

    return next({
      ctx: {
        userId,
      },
    });
  })
  // Here we get `userId` from the previous context, and it's all type safe.
  .use(async ({ ctx, next }) => {
    // Emulate a slow server.
    await new Promise((res) =>
      setTimeout(res, Math.max(Math.random() * 2000, 500))
    );

    const sessionId = await getSessionId();

    console.log(
      "HELLO FROM SECOND AUTH ACTION MIDDLEWARE, SESSION ID:",
      sessionId
    );

    return next({
      ctx: {
        ...ctx, // here we spread the previous context to extend it
        sessionId, // with session id
      },
    });
  });
