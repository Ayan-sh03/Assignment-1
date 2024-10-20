class ASTNode {
  type: string
  value: any
  left: ASTNode | null
  right: ASTNode | null
  operator: string | null

  constructor(type: string, value: any = null) {
    this.type = type
    this.value = value
    this.left = null
    this.right = null
    this.operator = null
  }

  toString(indent: string = ''): string {
    let result = indent + this.type
    if (this.value !== null) result += `: ${this.value}`
    if (this.operator) result += ` (${this.operator})`
    result += '\n'
    if (this.left) result += this.left.toString(indent + '  ')
    if (this.right) result += this.right.toString(indent + '  ')
    return result
  }
}

interface ASTNodeData {
  type: string
  value?: any
  operator?: string
  left?: ASTNodeData
  right?: ASTNodeData
}

export const jsonToAST = (json: ASTNodeData): ASTNode => {
  const buildNode = (nodeData: ASTNodeData): ASTNode => {
    const node = new ASTNode(nodeData.type, nodeData.value)
    node.operator = nodeData.operator || null

    if (nodeData.left) {
      node.left = buildNode(nodeData.left)
    }
    if (nodeData.right) {
      node.right = buildNode(nodeData.right)
    }

    return node
  }
  return buildNode(json)
}
