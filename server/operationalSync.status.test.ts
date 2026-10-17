import assert from "node:assert/strict";
import test from "node:test";
import { customerStatusFromOperational } from "./operationalSync";

test("traduce todas las etapas Partner a etapas Customer", () => {
  assert.deepEqual(Object.fromEntries(["pending", "accepted", "preparing", "ready_for_pickup", "picked_up", "on_the_way", "delivered", "cancelled"].map((status) => [status, customerStatusFromOperational(status)])), {
    pending: "placed", accepted: "accepted", preparing: "ready", ready_for_pickup: "ready", picked_up: "picked_up", on_the_way: "delivering", delivered: "delivered", cancelled: "cancelled",
  });
});
test("un estado desconocido no altera la tarjeta Customer", () => assert.equal(customerStatusFromOperational("unknown"), null));
