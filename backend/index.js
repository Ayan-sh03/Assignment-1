const express = require('express')
const { Pool } = require('pg')
const cors = require('cors')
require('dotenv').config()

const app = express()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

app.use(express.json())
app.use(cors())

app.get('/', (_, res) => {
  res.send('Hello World!')
})

const createASTTable = async () => {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS ast_rules (
        id SERIAL PRIMARY KEY,
        rule_string TEXT NOT NULL,
        rule_name TEXT NOT NULL UNIQUE,
        rule JSONB NOT NULL
      );
    `)
  } catch (err) {
    console.error('Error creating AST table:', err)
  } finally {
    client.release()
  }
}

createASTTable()

class ASTNode {
  constructor(type, value = null) {
    this.type = type
    this.value = value
    this.left = null
    this.right = null
    this.operator = null
  }

  toString(indent = '') {
    let result = indent + this.type
    if (this.value !== null) result += `: ${this.value}`
    if (this.operator) result += ` (${this.operator})`
    result += '\n'
    if (this.left) result += this.left.toString(indent + '  ')
    if (this.right) result += this.right.toString(indent + '  ')
    return result
  }
}

const astToRuleString = (node) => {
  if (node.type === 'ComparisonExpression') {
    const leftValue = node.left.value
    const rightValue = node.right.value
    return `${leftValue} ${node.operator} ${rightValue}`
  }

  if (node.type === 'BinaryExpression') {
    const left = astToRuleString(node.left)
    const right = astToRuleString(node.right)

    // Add parentheses for nested binary expressions to maintain precedence
    const leftStr = node.left.type === 'BinaryExpression' ? `(${left})` : left
    const rightStr =
      node.right.type === 'BinaryExpression' ? `(${right})` : right

    return `${leftStr} ${node.operator} ${rightStr}`
  }

  // For Identifier and Literal nodes
  return node.value
}

const tokenize = (input) => {
  return input.match(/\(|\)|\w+|[<>=]+|'[^']*'|\d+/g)
}

const parse = (tokens) => {
  let current = 0

  const parseExpression = () => {
    let node = parseTerm()

    while (current < tokens.length && ['AND', 'OR'].includes(tokens[current])) {
      const operator = tokens[current]
      current++
      const right = parseTerm()
      const newNode = new ASTNode('BinaryExpression')
      newNode.operator = operator
      newNode.left = node
      newNode.right = right
      node = newNode
    }

    return node
  }

  const parseTerm = () => {
    if (tokens[current] === '(') {
      current++
      const node = parseExpression()
      current++ // Skip closing parenthesis
      return node
    }

    if (['>', '<', '=', '>=', '<='].includes(tokens[current + 1])) {
      const left = new ASTNode('Identifier', tokens[current])
      const operator = tokens[current + 1]
      const right = new ASTNode('Literal', tokens[current + 2])
      current += 3
      const node = new ASTNode('ComparisonExpression')
      node.operator = operator
      node.left = left
      node.right = right
      return node
    }

    return new ASTNode('Literal', tokens[current++])
  }

  return parseExpression()
}

const evaluateAST = (ast, tuple) => {
  const { age, department, salary, experience } = tuple

  console.log(
    `Evaluating tuple: [${age}, ${department}, ${salary}, ${experience}]`
  )
  const getValue = (node) => {
    if (node.type === 'Literal') {
      // Remove quotes from string literals and convert to appropriate type
      const value = node.value.replace(/'/g, '')
      return isNaN(value) ? value : Number(value)
    } else if (node.type === 'Identifier') {
      switch (node.value) {
        case 'age':
          return age
        case 'department':
          return department
        case 'salary':
          return salary
        case 'experience':
          return experience
        default:
          throw new Error(`Unknown identifier: ${node.value}`)
      }
    }
  }

  const evaluate = (node) => {
    if (node.type === 'BinaryExpression') {
      const left = evaluate(node.left)
      const right = evaluate(node.right)

      switch (node.operator) {
        case 'AND':
          return left && right
        case 'OR':
          return left || right
        default:
          throw new Error(`Unknown binary operator: ${node.operator}`)
      }
    } else if (node.type === 'ComparisonExpression') {
      const left = getValue(node.left)
      const right = getValue(node.right)
      switch (node.operator) {
        case '>':
          return left > right
        case '<':
          return left < right
        case '=':
          return left === right // Changed to strict equality
        case '>=':
          return left >= right
        case '<=':
          return left <= right
        default:
          throw new Error(`Unknown comparison operator: ${node.operator}`)
      }
    }
    throw new Error(`Unknown node type: ${node.type}`)
  }

  return evaluate(ast)
}

const combine_rules = (rules) => {
  // Parse all rules into ASTs
  const asts = rules.map((rule) => {
    const tokens = tokenize(rule)
    return parse(tokens)
  })

  // Helper function to count operator occurrences
  const countOperators = (ast) => {
    let count = { AND: 0, OR: 0 }
    const traverse = (node) => {
      if (node.type === 'BinaryExpression') {
        count[node.operator]++
        traverse(node.left)
        traverse(node.right)
      }
    }
    traverse(ast)
    return count
  }

  // Count total operators across all ASTs
  const totalCounts = asts.reduce(
    (acc, ast) => {
      const count = countOperators(ast)
      acc.AND += count.AND
      acc.OR += count.OR
      return acc
    },
    { AND: 0, OR: 0 }
  )

  // Determine the most frequent operator
  const mostFrequentOp = totalCounts.AND >= totalCounts.OR ? 'AND' : 'OR'

  // Combine ASTs using the most frequent operator
  const combinedAST = asts.reduce((combined, ast) => {
    if (!combined) return ast
    const newNode = new ASTNode('BinaryExpression')
    newNode.operator = mostFrequentOp
    newNode.left = combined
    newNode.right = ast
    return newNode
  }, null)

  // Optimize the combined AST
  const optimize = (node) => {
    if (node.type !== 'BinaryExpression') return node

    node.left = optimize(node.left)
    node.right = optimize(node.right)

    // Flatten nested operations with the same operator
    if (
      node.left.type === 'BinaryExpression' &&
      node.left.operator === node.operator
    ) {
      return {
        type: 'BinaryExpression',
        operator: node.operator,
        left: node.left.left,
        right: {
          type: 'BinaryExpression',
          operator: node.operator,
          left: node.left.right,
          right: node.right,
        },
      }
    }

    return node
  }

  const optimizedAST = optimize(combinedAST)

  return optimizedAST
}

const jsonToAST = (json) => {
  const buildNode = (nodeData) => {
    const node = new ASTNode(nodeData.type, nodeData.value)
    node.operator = nodeData.operator

    if (nodeData.left) {
      node.left = buildNode(nodeData.left)
    }
    if (nodeData.right) {
      node.right = buildNode(nodeData.right)
    }

    return node
  }

  return buildNode(JSON.parse(json))
}

app.post('/api/createRule', async (req, res) => {
  const { rule, rule_name } = req.body

  const tokenizedRule = tokenize(rule)
  const parsedRule = parse(tokenizedRule)

  try {
    const client = await pool.connect()
    const result = await client.query(
      'INSERT INTO ast_rules (rule_string,rule,rule_name) VALUES ($1,$2,$3) RETURNING id',
      [rule, parsedRule, rule_name]
    )
    const insertedId = result.rows[0].id
    client.release()
    return res
      .status(200)
      .json({ message: 'Rule created and stored successfully', id: insertedId })
  } catch (err) {
    console.error('Error storing rule:', err)
    return res.status(500).json({ message: 'Error storing rule' })
  }
})

app.post('/api/combineRules', async (req, res) => {
  const { ruleids } = req.body
  //fetch rules from database

  const placeholders = ruleids.map((_, index) => `$${index + 1}`).join(',')
  const query = `SELECT rule,rule_string,rule_name FROM ast_rules WHERE id IN (${placeholders})`

  const client = await pool.connect()
  const result = await client.query(query, ruleids)

  try {
    const rules = result.rows.map((row) => row.rule_string)

    console.log(rules)

    const combinedAST = combine_rules(rules)
    // console.log('Combined AST:', JSON.stringify(combinedAST, null, 2))

    //get rule_string from combined_AST
    const ruleString = astToRuleString(jsonToAST(JSON.stringify(combinedAST)))
    console.log(ruleString)

    //add the combined rule in db
    const insertQuery = `
        INSERT INTO ast_rules (rule_string, rule,rule_name)
        VALUES ($1, $2, $3)
        RETURNING id
        `
    //combine rule name : rule.rule_name + rule2.rule_name ..
    let ruleName = ''
    //excep the last rule name
    result.rows.forEach((rule, i) => {
      if (i === rules.length - 1) ruleName += rule.rule_name
      else ruleName += rule.rule_name + ' + '
    })

    console.log(ruleName)

    const values = JSON.stringify(combinedAST)

    const rs = await client.query(insertQuery, [ruleString, values, ruleName])
    const insertedId = rs.rows[0].id

    return res.status(200).json({ combinedAST, id: insertedId })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: 'Error combining rules' })
  }
})

app.listen(3000, () => console.log('Server is Running 👍'))

app.get('/api/getRules', async (req, res) => {
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT id, rule_name FROM ast_rules')
    client.release()

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No rules found' })
    }

    const rules = result.rows.map((row) => ({
      id: row.id,
      ruleName: row.rule_name,
    }))

    return res.status(200).json({ rules })
  } catch (err) {
    console.error('Error retrieving rules:', err)
    return res.status(500).json({ message: 'Error retrieving rules' })
  }
})

app.post('/api/eval', async (req, res) => {
  const { ruleId, data } = req.body
  console.log(data)

  try {
    const client = await pool.connect()
    const result = await client.query(
      'SELECT rule  FROM ast_rules WHERE id = $1',
      [ruleId]
    )
    client.release()
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Rule not found' })
    }
    const rule = result.rows[0].rule

    console.log(rule)

    const ruleAST = jsonToAST(JSON.stringify(rule))
    const evalResult = evaluateAST(ruleAST, data)
    return res.status(200).json({ result: evalResult })
  } catch (err) {
    console.error('Error evaluating rule:', err)
    return res.status(500).json({ message: 'Error evaluating rule' })
  }
})

// app.post('/api/combineRules', async (req, res) => {
//   const { ruleIds } = req.body

//   try {
//     const client = await pool.connect()
//     const result = await client.query(
//       'SELECT rule,rule_name FROM ast_rules WHERE id = ANY($1)',
//       [ruleIds]
//     )
//     client.release()

//     const rules = result.rows.map((row) => JSON.stringify(row.rule))
//     const combinedAST = combine_rules(rules)
//     console.log('Combined AST:', JSON.stringify(combinedAST, null, 2))

//     //get rule_string from combined_AST
//     const ruleString = jsonToAST(combinedAST)

//     //add the combined rule in db
//     const insertQuery = `
//     INSERT INTO ast_rules (rule_string, rule,rule_name)
//     VALUES ($1, $2, $3)
//     RETURNING id
//     `
//     //combine rule name : rule.rule_name + rule2.rule_name ..
//     let ruleName = ''
//     //excep the last rule name
//     rules.forEach((rule, i) => {
//       if (i === rules.length - 1) ruleName += rule.rule_name
//       else ruleName += rule.rule_name + ' + '
//     })

//     const values = JSON.stringify(combinedAST)

//     const rs = await client.query(insertQuery, [ruleString, values, ruleName])
//     const insertedId = rs.rows[0].id

//     return res.status(200).json({ combinedAST, id: insertedId })
//   } catch (err) {
//     console.error('Error combining rules:', err)
//     return res.status(500).json({ message: 'Error combining rules' })
//   }
// })
