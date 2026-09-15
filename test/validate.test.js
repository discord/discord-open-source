"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { validateData, validateRecord, requestInvite } = require("../validate");

const valid = {
  title: "Example",
  inviteCode: "example-123",
  githubUrl: "https://github.com/example/project",
  logo: "adafruit.svg",
};

test("accepts a structurally valid record and existing logo", () => {
  assert.deepEqual(
    validateRecord(valid, 0, __dirname + "/../logos").errors,
    [],
  );
});

test("rejects malformed URLs and path traversal", () => {
  const result = validateRecord(
    {
      ...valid,
      githubUrl: "https://example.com/project.git",
      logo: "../secret.svg",
    },
    0,
    __dirname + "/../logos",
  );
  assert.ok(result.errors.some((error) => error.includes("githubUrl")));
  assert.ok(result.errors.some((error) => error.includes("inside the logos")));
});

test("reports malformed array members without crashing", () => {
  const result = validateData({ data: [null, valid] }, __dirname + "/../logos");
  assert.ok(
    result.errors.some((error) =>
      error.includes("record 1: record must be an object"),
    ),
  );
});

test("rejects duplicate projects and unsorted data", () => {
  const result = validateData(
    { data: [valid, { ...valid, title: "Another" }] },
    __dirname + "/../logos",
  );
  assert.ok(
    result.errors.some((error) => error.includes("duplicate githubUrl")),
  );
  assert.ok(
    result.errors.some((error) => error.includes("alphabetical order")),
  );
});

test("retries transient failures and eventually succeeds", async () => {
  let calls = 0;
  const response = await requestInvite(
    "example",
    async () => {
      calls += 1;
      if (calls < 3) throw new Error("temporary outage");
      return {
        ok: true,
        status: 200,
        json: async () => ({ guild: { features: ["COMMUNITY"] } }),
      };
    },
    async () => {},
  );
  assert.equal(calls, 3);
  assert.equal(response.guild.features[0], "COMMUNITY");
});

test("fails clearly after bounded network retries", async () => {
  await assert.rejects(
    requestInvite(
      "example",
      async () => {
        throw new Error("offline");
      },
      async () => {},
    ),
    /invite request failed: offline/,
  );
});

test("honors a Discord rate-limit delay", async () => {
  const delays = [];
  let calls = 0;
  await requestInvite(
    "example",
    async () => {
      calls += 1;
      if (calls === 1)
        return {
          ok: false,
          status: 429,
          json: async () => ({ retry_after: 0.01 }),
        };
      return {
        ok: true,
        status: 200,
        json: async () => ({ guild: { features: ["COMMUNITY"] } }),
      };
    },
    async (delay) => delays.push(delay),
  );
  assert.equal(calls, 2);
  assert.deepEqual(delays, [10]);
});

test("does not retry a permanent client error", async () => {
  let calls = 0;
  await assert.rejects(
    requestInvite(
      "example",
      async () => {
        calls += 1;
        return {
          ok: false,
          status: 404,
          json: async () => ({ message: "unknown invite" }),
        };
      },
      async () => {},
    ),
    /HTTP 404/,
  );
  assert.equal(calls, 1);
});
