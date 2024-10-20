import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { PlusCircle, X } from 'lucide-react'
import { useToast } from './hooks/use-toast'
import { Button } from './Components/ui/button'
import { Label } from './Components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './Components/ui/select'
import { Input } from './Components/ui/input'

type Condition = 'AND' | 'OR'

type RuleCondition = {
  field: string
  operator: string
  value: string
  condition: Condition
}

type Rule = {
  id: string
  conditions: RuleCondition[]
}

export default function RuleGeneratorWithSubmit() {
  const [rules, setRules] = useState<Rule[]>([])
  const [ruleConditions, setRuleConditions] = useState<Condition[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const addRule = () => {
    setRules([
      ...rules,
      {
        id: Date.now().toString(),
        conditions: [
          { field: 'age', operator: '>', value: '', condition: 'AND' },
          { field: 'department', operator: '=', value: '', condition: 'AND' },
          { field: 'salary', operator: '>', value: '', condition: 'AND' },
          { field: 'experience', operator: '>', value: '', condition: 'AND' },
        ],
      },
    ])
    if (rules.length > 0) {
      setRuleConditions([...ruleConditions, 'AND'])
    }
  }

  const updateRuleCondition = (
    ruleId: string,
    index: number,
    field: keyof RuleCondition,
    value: string
  ) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              conditions: rule.conditions.map((cond, i) =>
                i === index ? { ...cond, [field]: value } : cond
              ),
            }
          : rule
      )
    )
  }

  const removeRule = (index: number) => {
    const newRules = [...rules]
    newRules.splice(index, 1)
    setRules(newRules)

    const newRuleConditions = [...ruleConditions]
    newRuleConditions.splice(index - 1, 1)
    setRuleConditions(newRuleConditions)
  }

  const toggleRuleCondition = (index: number) => {
    setRuleConditions(
      ruleConditions.map((cond, i) =>
        i === index ? (cond === 'AND' ? 'OR' : 'AND') : cond
      )
    )
  }

  const generateRule = (rule: Rule) => {
    return rule.conditions
      .filter((cond) => cond.value)
      .map((cond, index) => {
        const conditionStr = index === 0 ? '' : ` ${cond.condition} `
        if (cond.field === 'department') {
          return `${conditionStr}(${cond.field} ${cond.operator} '${cond.value}')`
        }
        return `${conditionStr}(${cond.field} ${cond.operator} ${cond.value})`
      })
      .join('')
  }

  const generateCombinedRule = () => {
    return rules
      .map(generateRule)
      .filter(Boolean)
      .join(` ${ruleConditions.join(' ')} `)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const combinedRule = generateCombinedRule()

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/createRule`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rule: combinedRule }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to create rule')
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const data = await response.json()
      toast({
        title: 'Success',
        description: 'Rule created successfully!',
      })
    } catch (error) {
      console.error('Error creating rule:', error)
      toast({
        title: 'Error',
        description: 'Failed to create rule. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center rounded-  justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl rounded-lg space-y-6"
      >
        <h1 className="text-4xl font-bold text-center mb-6">
          Rule Generator with Submit
        </h1>

        <AnimatePresence>
          {rules.map((rule, ruleIndex) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {ruleIndex > 0 && (
                <Button
                  variant="outline"
                  onClick={() => toggleRuleCondition(ruleIndex - 1)}
                  className="mb-2 bg-zinc-500 text-white"
                >
                  {ruleConditions[ruleIndex - 1]}
                </Button>
              )}
              <div className="bg-gray-800 p-4 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    Rule {ruleIndex + 1}
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRule(ruleIndex)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {rule.conditions.map((condition, index) => (
                  <div key={index} className="grid grid-cols-5 gap-2 items-end">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor={`${rule.id}-${condition.field}`}>
                        {condition.field.charAt(0).toUpperCase() +
                          condition.field.slice(1)}
                      </Label>
                      {condition.field === 'department' ? (
                        <Select
                          onValueChange={(value) =>
                            updateRuleCondition(rule.id, index, 'value', value)
                          }
                        >
                          <SelectTrigger id={`${rule.id}-${condition.field}`}>
                            <SelectValue
                              placeholder={`Select ${condition.field}`}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Sales">Sales</SelectItem>
                            <SelectItem value="Marketing">Marketing</SelectItem>
                            <SelectItem value="Engineering">
                              Engineering
                            </SelectItem>
                            <SelectItem value="HR">HR</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : condition.field === 'age' ? (
                        <Select
                          onValueChange={(value) =>
                            updateRuleCondition(rule.id, index, 'value', value)
                          }
                        >
                          <SelectTrigger id={`${rule.id}-${condition.field}`}>
                            <SelectValue
                              placeholder={`Select ${condition.field}`}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from(
                              { length: 5 },
                              (_, i) => i * 10 + 20
                            ).map((age) => (
                              <SelectItem key={age} value={age.toString()}>
                                {age}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={`${rule.id}-${condition.field}`}
                          type="number"
                          placeholder={`Enter ${condition.field}`}
                          value={condition.value}
                          onChange={(e) =>
                            updateRuleCondition(
                              rule.id,
                              index,
                              'value',
                              e.target.value
                            )
                          }
                          className="bg-gray-700 border-gray-600"
                        />
                      )}
                    </div>
                    <div>
                      <Select
                        onValueChange={(value) =>
                          updateRuleCondition(rule.id, index, 'operator', value)
                        }
                      >
                        <SelectTrigger
                          id={`${rule.id}-${condition.field}-operator`}
                        >
                          <SelectValue placeholder="Operator" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value=">">{'>'}</SelectItem>
                          <SelectItem value="<">{'<'}</SelectItem>
                          <SelectItem value="=">{'='}</SelectItem>
                          <SelectItem value=">=">{'>='}</SelectItem>
                          <SelectItem value="<=">{'<='}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {index > 0 && index < rule.conditions.length && (
                      <div className="col-span-2">
                        <Select
                          onValueChange={(value: Condition) =>
                            updateRuleCondition(
                              rule.id,
                              index,
                              'condition',
                              value
                            )
                          }
                        >
                          <SelectTrigger
                            id={`${rule.id}-${condition.field}-condition`}
                          >
                            <SelectValue placeholder="Condition" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AND">AND</SelectItem>
                            <SelectItem value="OR">OR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="flex justify-between items-center">
          <Button onClick={addRule}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Rule
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rules.length === 0}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rules'}
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.5 }}
          className="mt-6 p-4 bg-gray-800 rounded-lg overflow-hidden"
        >
          <h2 className="text-xl font-semibold mb-2">
            Generated Combined Rule:
          </h2>
          <p className="text-green-400 break-words">{generateCombinedRule()}</p>
        </motion.div>
      </motion.div>
    </div>
  )
}
