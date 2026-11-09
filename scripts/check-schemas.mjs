import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import {
  PROTOCOL_VERSION,
  createAjv,
  loadSchemaFiles,
  MESSAGE_SCHEMAS,
  rootDir,
  schemasDir,
} from "./lib/load-ajv.mjs"

const versionFile = readFileSync(join(rootDir, "VERSION"), "utf8").trim()
if (versionFile !== PROTOCOL_VERSION) {
  throw new Error(`VERSION ${versionFile} != protocol const ${PROTOCOL_VERSION}`)
}

const pkg = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf8"))
if (pkg.version !== PROTOCOL_VERSION) {
  throw new Error(`package.json version ${pkg.version} != ${PROTOCOL_VERSION}`)
}

const files = loadSchemaFiles()
for (const { name, schema } of files) {
  if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema") {
    throw new Error(`${name}: expected draft/2020-12 $schema`)
  }
  if (schema.$id !== name) {
    throw new Error(`${name}: $id must equal filename`)
  }
}

const ajv = createAjv()
for (const name of MESSAGE_SCHEMAS) {
  const validate = ajv.getSchema(name)
  if (!validate) {
    throw new Error(`failed to compile ${name}`)
  }
}

const businessMarkers = [
  "function ",
  "eval(",
  "Function(",
  "require(",
  "import(",
]
for (const { name, schema } of files) {
  const text = JSON.stringify(schema)
  for (const marker of businessMarkers) {
    if (text.includes(marker)) {
      throw new Error(`${name}: forbidden business-logic marker ${marker}`)
    }
  }
}

const catalogPath = join(rootDir, "schemas", "catalog.json")
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"))
if (catalog.protocol_version !== PROTOCOL_VERSION) {
  throw new Error("catalog protocol_version mismatch")
}
const expectedIds = files.map((f) => f.name)
if (JSON.stringify(catalog.schemas) !== JSON.stringify(expectedIds)) {
  throw new Error("catalog schemas list mismatch")
}

const clientIndex = join(rootDir, "clients", "typescript", "index.ts")
const clientText = readFileSync(clientIndex, "utf8")
if (!clientText.includes(`PROTOCOL_VERSION = "${PROTOCOL_VERSION}"`)) {
  throw new Error("generated client PROTOCOL_VERSION mismatch; run npm run generate")
}

const fixturesRoot = join(rootDir, "fixtures")
for (const family of MESSAGE_SCHEMAS.map((n) => n.replace(/\.json$/, ""))) {
  for (const bucket of ["valid", "invalid"]) {
    const dir = join(fixturesRoot, bucket, family)
    const names = readdirSync(dir).filter((n) => n.endsWith(".json"))
    if (names.length < 1) {
      throw new Error(`need fixtures under fixtures/${bucket}/${family}`)
    }
    const schemaId = `${family}.json`
    const validate = ajv.getSchema(schemaId)
    for (const name of names) {
      const data = JSON.parse(readFileSync(join(dir, name), "utf8"))
      const ok = validate(data)
      if (bucket === "valid" && !ok) {
        throw new Error(
          `expected valid ${family}/${name}: ${ajv.errorsText(validate.errors)}`
        )
      }
      if (bucket === "invalid" && ok) {
        throw new Error(`expected invalid ${family}/${name} to fail`)
      }
    }
  }
}

console.log(
  `SCHEMA_CHECK_OK protocol_version=${PROTOCOL_VERSION} schemas=${files.length} message_schemas=${MESSAGE_SCHEMAS.length}`
)
