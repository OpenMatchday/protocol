import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import {
  PROTOCOL_VERSION,
  createAjv,
  MESSAGE_SCHEMAS,
  rootDir,
} from "../scripts/lib/load-ajv.mjs"

describe("protocol schemas v0", () => {
  it("pins protocol version 0.1.0", () => {
    assert.equal(PROTOCOL_VERSION, "0.1.0")
    assert.equal(readFileSync(join(rootDir, "VERSION"), "utf8").trim(), "0.1.0")
  })

  it("compiles every message schema", () => {
    const ajv = createAjv()
    for (const id of MESSAGE_SCHEMAS) {
      assert.ok(ajv.getSchema(id), id)
    }
  })

  it("accepts valid fixtures and rejects invalid fixtures", () => {
    const ajv = createAjv()
    for (const schemaId of MESSAGE_SCHEMAS) {
      const family = schemaId.replace(/\.json$/, "")
      const validate = ajv.getSchema(schemaId)
      for (const bucket of ["valid", "invalid"]) {
        const dir = join(rootDir, "fixtures", bucket, family)
        for (const name of readdirSync(dir).filter((n) => n.endsWith(".json"))) {
          const data = JSON.parse(readFileSync(join(dir, name), "utf8"))
          const ok = validate(data)
          if (bucket === "valid") {
            assert.equal(ok, true, `${family}/${name}: ${ajv.errorsText(validate.errors)}`)
          } else {
            assert.equal(ok, false, `${family}/${name} should be invalid`)
          }
        }
      }
    }
  })

  it("refuses cellular media medium on pairing.request", () => {
    const ajv = createAjv()
    const validate = ajv.getSchema("pairing.json")
    const ok = validate({
      protocol_version: "0.1.0",
      message_id: "m",
      sent_at: "2026-11-09T09:00:00.000Z",
      kind: "pairing.request",
      payload: {
        request_id: "r",
        device_id: "d",
        device_label: "cam",
        requested_roles: ["camera"],
        control_medium: "manual_ip",
        media_medium: "ble",
      },
    })
    assert.equal(ok, false)
  })
})
