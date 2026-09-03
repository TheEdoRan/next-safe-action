// Verifies the `useOptimisticStateAction` return type: `optimisticState` is the confirmed domain
// state (never `Data | undefined`), and intersecting it with the status union preserves narrowing.

import { expectTypeOf, test } from "vitest";
import { z } from "zod";
import { useOptimisticStateAction } from "../../hooks";
import type { UseOptimisticStateActionHookReturn, UseStateActionHookReturn } from "../../hooks.types";
import type { NavigationKind, SafeStateActionFn } from "../../index.types";
import type { ValidationErrors } from "../../validation-errors.types";

const schema = z.object({ name: z.string() });

type Data = { id: string }[];
type ServerError = string;
type Shape = ValidationErrors<typeof schema>;
type State = { id: string }[];
type Return = UseOptimisticStateActionHookReturn<ServerError, typeof schema, Shape, Data, State>;

// ─── optimisticState ────────────────────────────────────────────────────────

test("optimisticState is exactly State, never undefined", () => {
	expectTypeOf<Return["optimisticState"]>().toEqualTypeOf<State>();
	expectTypeOf<Return["optimisticState"]>().not.toBeNullable();
});

test("State is independent of Data", () => {
	type Pending = { kind: "move"; id: string }[];
	type ListReturn = UseOptimisticStateActionHookReturn<ServerError, typeof schema, Shape, void, Pending>;
	expectTypeOf<ListReturn["optimisticState"]>().toEqualTypeOf<Pending>();
});

// ─── Structure ──────────────────────────────────────────────────────────────

test("extends UseStateActionHookReturn, so formAction is present", () => {
	expectTypeOf<Return>().toMatchTypeOf<UseStateActionHookReturn<ServerError, typeof schema, Shape, Data>>();
	expectTypeOf<Return["formAction"]>().not.toBeAny();
	expectTypeOf<Return["reset"]>().toEqualTypeOf<() => void>();
});

test("narrowing on status still narrows result", () => {
	const r = {} as Return;

	if (r.status === "hasSucceeded") {
		expectTypeOf(r.result.data).toEqualTypeOf<Data>();
		// `optimisticState` survives the narrowing.
		expectTypeOf(r.optimisticState).toEqualTypeOf<State>();
	}

	if (r.status === "hasErrored") {
		expectTypeOf(r.result.validationErrors).toEqualTypeOf<Shape | undefined>();
	}
});

// ─── Inference from a real call ─────────────────────────────────────────────

test("infers State from currentState and Data from the action", () => {
	const stateActionFn = {} as SafeStateActionFn<ServerError, typeof schema, [], Shape, Data>;
	const currentState: State = [];

	const hook = useOptimisticStateAction(stateActionFn, {
		currentState,
		updateFn: (state, input) => {
			expectTypeOf(state).toEqualTypeOf<State>();
			expectTypeOf(input).toEqualTypeOf<{ name: string }>();
			return state;
		},
	});

	expectTypeOf(hook.optimisticState).toEqualTypeOf<State>();
	expectTypeOf(hook.execute).toBeCallableWith({ name: "x" });
});

// ─── Data must be the full next State ───────────────────────────────────────

test("an action returning the full next state is accepted", () => {
	const stateActionFn = {} as SafeStateActionFn<ServerError, typeof schema, [], Shape, Data>;
	const currentState: State = [];

	const hook = useOptimisticStateAction(stateActionFn, { currentState, updateFn: (state) => state });

	expectTypeOf(hook.optimisticState).toEqualTypeOf<State>();
});

test("an action returning something other than the next state is rejected", () => {
	// The hook adopts `data` as the confirmed state and hands it to the next queued dispatch, so a
	// partial payload would collapse the UI at commit. Guarded by `ActionDataFitsState`.
	const partialFn = {} as SafeStateActionFn<ServerError, typeof schema, [], Shape, { ok: boolean }>;
	const currentState: State = [];

	// @ts-expect-error - the action's data is not the full next state
	useOptimisticStateAction(partialFn, { currentState, updateFn: (state) => state });
});

test("an action that returns nothing is exempt, so the pending-changes-list shape still compiles", () => {
	type Pending = { kind: "move"; id: string }[];
	const voidFn = {} as SafeStateActionFn<ServerError, typeof schema, [], Shape, void>;
	const currentState: Pending = [];

	const hook = useOptimisticStateAction(voidFn, {
		currentState,
		updateFn: (state, input) => [...state, { kind: "move" as const, id: input.name }],
	});

	expectTypeOf(hook.optimisticState).toEqualTypeOf<Pending>();
});

test("initResult narrows the idle branch, independently of currentState", () => {
	type Seeded = UseOptimisticStateActionHookReturn<ServerError, typeof schema, Shape, Data, State, { data: Data }>;
	const r = {} as Seeded;

	if (r.status === "idle") {
		expectTypeOf(r.result.data).toEqualTypeOf<Data>();
	}
});

// ─── ActionDataFitsState edge cases ─────────────────────────────────────────

test("Data narrower than State is accepted", () => {
	type Narrow = { id: string; kind: "a" }[];
	const narrowFn = {} as SafeStateActionFn<ServerError, typeof schema, [], Shape, Narrow>;
	const currentState: State = [];

	const hook = useOptimisticStateAction(narrowFn, { currentState, updateFn: (state) => state });

	expectTypeOf(hook.optimisticState).toEqualTypeOf<State>();
});

test("Data wider than State is rejected", () => {
	// `data` becomes the confirmed value verbatim, so a `null` branch would hand the reducer and
	// the next queued dispatch something that is not a `State` at all.
	const wideFn = {} as SafeStateActionFn<ServerError, typeof schema, [], Shape, Data | null>;
	const currentState: State = [];

	// @ts-expect-error - the action's data is not always the full next state
	useOptimisticStateAction(wideFn, { currentState, updateFn: (state) => state });
});

test("an action whose data is optional is rejected", () => {
	const maybeFn = {} as SafeStateActionFn<ServerError, typeof schema, [], Shape, Data | { partial: true }>;
	const currentState: State = [];

	// @ts-expect-error - one branch of the union is not the full next state
	useOptimisticStateAction(maybeFn, { currentState, updateFn: (state) => state });
});

// ─── Options surface ────────────────────────────────────────────────────────

test("accepts the shared hook options and callbacks", () => {
	const stateActionFn = {} as SafeStateActionFn<ServerError, typeof schema, [], Shape, Data>;
	const currentState: State = [];

	useOptimisticStateAction(stateActionFn, {
		currentState,
		updateFn: (state) => state,
		initResult: { data: [] as Data },
		onExecute: ({ input }) => expectTypeOf(input).toEqualTypeOf<{ name: string }>(),
		onSuccess: ({ data }) => expectTypeOf(data).toEqualTypeOf<Data>(),
		onError: ({ error }) => expectTypeOf(error.serverError).toEqualTypeOf<ServerError | undefined>(),
		onNavigation: ({ navigationKind, input }) => {
			expectTypeOf(navigationKind).toEqualTypeOf<NavigationKind>();
			expectTypeOf(input).toEqualTypeOf<{ name: string }>();
		},
		onSettled: ({ input }) => expectTypeOf(input).toEqualTypeOf<{ name: string }>(),
	});
});

test("throwOnNavigation removes the navigation callbacks, as on every other hook", () => {
	const stateActionFn = {} as SafeStateActionFn<ServerError, typeof schema, [], Shape, Data>;
	const currentState: State = [];

	useOptimisticStateAction(stateActionFn, {
		currentState,
		updateFn: (state) => state,
		throwOnNavigation: true,
		onSuccess: ({ data }) => expectTypeOf(data).toEqualTypeOf<Data>(),
	});

	useOptimisticStateAction(stateActionFn, {
		currentState,
		updateFn: (state) => state,
		throwOnNavigation: true,
		// @ts-expect-error - the navigation error is thrown, so there is nothing to call back with
		onNavigation: () => {},
	});
});

test("updateFn state and return type are pinned to State, not to Data", () => {
	type Pending = { kind: "move"; id: string }[];
	const voidFn = {} as SafeStateActionFn<ServerError, typeof schema, [], Shape, void>;
	const currentState: Pending = [];

	useOptimisticStateAction(voidFn, {
		currentState,
		// @ts-expect-error - the reducer must return `State`
		updateFn: () => 42,
	});
});
