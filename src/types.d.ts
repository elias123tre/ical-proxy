interface Rule {
  id: number
  title: string
  enabled: boolean
  type: "show" | "hide"
  filters: Filter[]
  combine: "AND" | "OR"
}

interface Filter {
  property: "summary" | "description" | "date"
  regex: string
  negated: boolean
}

interface HideShowRule {
  id: number
  url: string
  type: "hide" | "show"
}
