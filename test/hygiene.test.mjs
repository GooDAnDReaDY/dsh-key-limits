import test from "node:test"
import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")

test("no release tgz archives exist in repository root", () => {
  const files = readdirSync(root)
  const tgzFiles = files.filter((f) => f.endsWith(".tgz"))
  assert.deepEqual(tgzFiles, [], "Repository root must not contain release .tgz archives")
})
