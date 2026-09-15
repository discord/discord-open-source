"use strict";

const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");

const DATA_FILE = path.join(__dirname, "communities.json");
const LOGOS_DIR = path.join(__dirname, "logos");
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;

function isHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function isProjectUrl(value) {
  if (!isHttpsUrl(value)) return false;
  const url = new URL(value);
  return !url.pathname.endsWith(".git");
}

function validateRecord(community, index, logosDir = LOGOS_DIR) {
  const errors = [];
  const warnings = [];
  const label =
    community && community.title ? community.title : `record ${index + 1}`;
  if (!community || typeof community !== "object" || Array.isArray(community))
    return { label, errors: ["record must be an object"], warnings };

  for (const field of ["title", "inviteCode", "githubUrl", "logo"]) {
    if (typeof community[field] !== "string" || community[field].trim() === "")
      errors.push(`${field} must be present and a non-empty string`);
  }
  if (
    typeof community.title === "string" &&
    community.title.trim() !== community.title
  )
    errors.push("title must not have leading or trailing whitespace");
  if (
    typeof community.inviteCode === "string" &&
    !/^[\w-]+$/.test(community.inviteCode)
  )
    errors.push(
      "inviteCode must contain only letters, numbers, underscores, or hyphens",
    );
  if (
    typeof community.githubUrl === "string" &&
    !isProjectUrl(community.githubUrl)
  )
    errors.push(
      "githubUrl must be a valid HTTPS project or organization URL, not a clone URL",
    );

  if (typeof community.logo === "string") {
    const logoName = community.logo.trim();
    const resolved = path.resolve(logosDir, logoName);
    if (path.dirname(resolved) !== path.resolve(logosDir))
      errors.push("logo must be a filename inside the logos directory");
    else if (!fs.existsSync(resolved))
      errors.push(`logo file does not exist: ${logoName}`);
    if (!/\.(svg|png)$/i.test(logoName))
      errors.push("logo must be an SVG or PNG file");
  }
  if (community.quote !== undefined && typeof community.quote !== "string")
    errors.push("quote must be a string when provided");
  else if (typeof community.quote === "string" && community.quote.length > 350)
    warnings.push("quote is longer than 350 characters");
  if (community.quoteSourceUrl !== undefined) {
    if (
      typeof community.quoteSourceUrl !== "string" ||
      !isHttpsUrl(community.quoteSourceUrl)
    )
      errors.push("quoteSourceUrl must be a valid https URL when provided");
    if (!community.quote) errors.push("quoteSourceUrl requires quote");
  }
  return { label, errors, warnings };
}

function validateData(document, logosDir = LOGOS_DIR) {
  const errors = [];
  const warnings = [];
  if (
    !document ||
    typeof document !== "object" ||
    !Array.isArray(document.data)
  )
    return {
      errors: ["top-level document must contain a data array"],
      warnings,
      records: [],
    };
  const seen = new Map();
  document.data.forEach((community, index) => {
    const result = validateRecord(community, index, logosDir);
    for (const message of result.errors)
      errors.push(`${result.label}: ${message}`);
    for (const message of result.warnings)
      warnings.push(`${result.label}: ${message}`);
    for (const field of ["title", "githubUrl"]) {
      const value = community && community[field];
      if (typeof value !== "string" || value === "") continue;
      const key = `${field}:${value.toLowerCase()}`;
      if (seen.has(key))
        errors.push(
          `${result.label}: duplicate ${field}; already used by ${seen.get(
            key,
          )}`,
        );
      else seen.set(key, result.label);
    }
  });
  const sorted = [...document.data].sort((a, b) =>
    String(a && a.title).localeCompare(String(b && b.title)),
  );
  if (
    sorted.some(
      (community, index) =>
        (community && community.title) !==
        (document.data[index] && document.data[index].title),
    )
  )
    errors.push("communities must be in alphabetical order by title");
  return { errors, warnings, records: document.data };
}

async function requestInvite(
  inviteCode,
  fetchImpl = fetch,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
) {
  const deadline = Date.now() + 60_000;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetchImpl(
        `https://discord.com/api/v10/invites/${encodeURIComponent(
          inviteCode,
        )}?with_expiration=1`,
        {
          signal: controller.signal,
          headers: {
            "user-agent": "open-source-community-directory-validator",
          },
        },
      );
      const body = await response.json();
      if (response.status === 429 || body.retry_after) {
        if (attempt === MAX_RETRIES - 1)
          throw new Error("rate limited after maximum retries");
        const waitMs = Math.max(0, Number(body.retry_after || 1) * 1000);
        if (Date.now() + waitMs > deadline)
          throw new Error(
            "rate limited beyond the 60 second validation deadline",
          );
        await sleep(waitMs);
        continue;
      }
      if (!response.ok) {
        const error = new Error(`Discord API returned HTTP ${response.status}`);
        error.retryable = response.status >= 500;
        throw error;
      }
      return body;
    } catch (error) {
      if (error.retryable === false) throw error;
      if (attempt === MAX_RETRIES - 1)
        throw new Error(`invite request failed: ${error.message}`);
      await sleep(250 * 2 ** attempt);
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error("invite request failed");
}

async function validateLiveInvite(community, fetchImpl, sleep) {
  const response = await requestInvite(community.inviteCode, fetchImpl, sleep);
  const errors = [];
  const warnings = [];
  if (!response.guild)
    errors.push(`invite ${community.inviteCode} does not resolve to a guild`);
  if (response.expires_at) errors.push("invite must not expire");
  if (response.guild && !response.guild.features?.includes("COMMUNITY"))
    warnings.push("COMMUNITY feature is not enabled");
  return { errors, warnings };
}

async function run({ online = false, fetchImpl, sleep } = {}) {
  const document = JSON.parse(await fsp.readFile(DATA_FILE, "utf8"));
  const result = validateData(document);
  for (const message of result.errors) console.error(`ERROR: ${message}`);
  for (const message of result.warnings) console.warn(`WARN: ${message}`);
  if (online && result.errors.length === 0) {
    for (const community of result.records) {
      try {
        const live = await validateLiveInvite(community, fetchImpl, sleep);
        for (const message of live.errors) {
          result.errors.push(`${community.title}: ${message}`);
          console.error(`ERROR: ${community.title}: ${message}`);
        }
        for (const message of live.warnings) {
          result.warnings.push(`${community.title}: ${message}`);
          console.warn(`WARN: ${community.title}: ${message}`);
        }
      } catch (error) {
        result.errors.push(`${community.title}: ${error.message}`);
        console.error(`ERROR: ${community.title}: ${error.message}`);
      }
    }
  }
  return result;
}

if (require.main === module)
  run({ online: process.argv.includes("--online") })
    .then((result) => {
      if (result.errors.length > 0) process.exitCode = 1;
    })
    .catch((error) => {
      console.error(`ERROR: ${error.message}`);
      process.exitCode = 1;
    });

module.exports = {
  validateRecord,
  validateData,
  requestInvite,
  validateLiveInvite,
  run,
};
