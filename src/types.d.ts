interface Rule {
  title: string
  enabled: boolean
  type: "show" | "hide"
  filters: Filter[]
  combine: "AND" | "OR"
}

interface Filter {
  property: "summary" | "description" | "date" | "id"
  regex: string
  negated: boolean
}
