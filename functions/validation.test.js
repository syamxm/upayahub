import { test } from "node:test"
import assert from "node:assert/strict"
import { decodedByteLength, readImage } from "./validation.js"

const png = Buffer.from("hello world").toString("base64")

test("decodedByteLength matches real buffer size", () => {
  for (const size of [1, 2, 3, 10, 1000]) {
    const base64 = Buffer.alloc(size, 7).toString("base64")
    assert.equal(decodedByteLength(base64), size)
  }
})

test("accepts a valid image", () => {
  assert.deepEqual(readImage({ mimeType: "image/png", data: png }), {
    mimeType: "image/png",
    base64: png,
  })
})

test("rejects bad input", () => {
  const cases = [
    null,
    "string",
    { mimeType: "image/gif", data: png },
    { mimeType: "text/html", data: png },
    { mimeType: "image/png", data: 123 },
    { mimeType: "image/png", data: "not base64!!" },
    { mimeType: "image/png", data: Buffer.alloc(5 * 1024 * 1024).toString("base64") },
  ]
  for (const input of cases) {
    assert.throws(() => readImage(input), (error) => error.code === "invalid-argument")
  }
})
