const html = (s: TemplateStringsArray, ...args: any[]) => {
  return s.map((ss, i) => `${ss}${args?.[i] ?? ""}`).join("")
}

export { html }
