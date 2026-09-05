import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const css = readFileSync(new URL("./index.css", import.meta.url), "utf8")

function readTokens(selector) {
  const start = css.indexOf(`\n${selector} {`)
  assert.ok(start !== -1, `no declaration block for ${selector}`)
  const block = css.slice(start + selector.length)
  const body = block.slice(block.indexOf("{") + 1, block.indexOf("}"))
  const tokens = {}
  for (const [, name, value] of body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)) {
    tokens[name] = value
  }
  return tokens
}

function channel(value) {
  const ratio = value / 255
  return ratio <= 0.04045 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16))
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrast(foreground, background) {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (light + 0.05) / (dark + 0.05)
}

const bodyTextPairs = [
  ["foreground", "background"],
  ["foreground", "card"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["primary", "background"],
  ["primary", "card"],
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["accent-foreground", "accent"],
  ["header-foreground", "header"],
  ["header-muted", "header"],
  ["tone-neutral-text", "tone-neutral-surface"],
  ["tone-info-text", "tone-info-surface"],
  ["tone-success-text", "tone-success-surface"],
  ["tone-warning-text", "tone-warning-surface"],
  ["tone-danger-text", "tone-danger-surface"],
]

const focusPairs = [
  ["ring", "background"],
  ["ring", "card"],
]

const surfacePairs = [["card", "background"]]

const themes = {
  light: readTokens(":root"),
  dark: readTokens('[data-theme="dark"]'),
}

for (const [theme, tokens] of Object.entries(themes)) {
  test(`${theme} theme defines every token`, () => {
    const names = [...bodyTextPairs, ...focusPairs, ...surfacePairs, ["border"]].flat()
    for (const name of new Set(names)) {
      assert.ok(tokens[name], `${theme}: --${name} is missing or not a 6-digit hex`)
    }
  })

  test(`${theme} theme text pairs meet WCAG AA 4.5:1`, () => {
    for (const [foreground, background] of bodyTextPairs) {
      const ratio = contrast(tokens[foreground], tokens[background])
      assert.ok(
        ratio >= 4.5,
        `${theme}: --${foreground} on --${background} is ${ratio.toFixed(2)}:1, needs 4.5:1`
      )
    }
  })

  test(`${theme} theme focus ring meets WCAG AA 3:1`, () => {
    for (const [foreground, background] of focusPairs) {
      const ratio = contrast(tokens[foreground], tokens[background])
      assert.ok(
        ratio >= 3,
        `${theme}: --${foreground} on --${background} is ${ratio.toFixed(2)}:1, needs 3:1`
      )
    }
  })

  test(`${theme} theme separates card from background`, () => {
    for (const [foreground, background] of surfacePairs) {
      const ratio = contrast(tokens[foreground], tokens[background])
      assert.ok(
        ratio >= 1.05,
        `${theme}: --${foreground} is indistinguishable from --${background}`
      )
    }
  })
}
