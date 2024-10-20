import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Button } from './button'
import { jsonToAST } from '../../lib/AST'
import { Checkbox } from './checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'

type Rule = {
  id: string
  ruleName: string
}

export default function RuleCombiner() {
  const [rules, setRules] = useState<Rule[]>([])
  const [selectedRules, setSelectedRules] = useState<string[]>([])
  const [globalCondition, setGlobalCondition] = useState<'AND' | 'OR'>('AND')
  const [combinedRule, setCombinedRule] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/getRules`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch rules')
      }
      const data = await response.json()
      // setRules(rules)
      console.log(data.rules)
      setRules(data.rules)
    } catch (error) {
      console.error('Error fetching rules:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch rules. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRuleSelection = (ruleId: string) => {
    setSelectedRules((prev) => {
      if (prev.includes(ruleId)) {
        return prev.filter((id) => id !== ruleId)
      }
      if (prev.length < 2) {
        return [...prev, ruleId]
      }
      return [prev[1], ruleId]
    })
  }

  const combineRules = async () => {
    if (selectedRules.length !== 2) {
      toast({
        title: 'Error',
        description: 'Please select exactly two rules to combine.',
        variant: 'destructive',
      })
      return
    }

    const rule1 = rules.find((r) => r.id === selectedRules[0])?.id
    const rule2 = rules.find((r) => r.id === selectedRules[1])?.id

    if (!rule1 || !rule2) {
      toast({
        title: 'Error',
        description: 'Selected rules not found.',
        variant: 'destructive',
      })
      return
    }

    const combined = `(${rule1}) ${globalCondition} (${rule2})`
    setCombinedRule(combined)

    //combine in backend too
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/combineRules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ruleids: [rule1, rule2] }),
      })

      toast({
        title: 'Success',
        description: 'Rules combined successfully.',
      })
    } catch (error) {
      console.error('Error combining rules:', error)
      toast({
        title: 'Error',
        description: 'Failed to combine rules. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl space-y-6"
      >
        <h1 className="text-3xl font-bold text-center mb-6">Rule Combiner</h1>

        {isLoading ? (
          <p className="text-center">Loading rules...</p>
        ) : (
          <>
            <div className="space-y-4">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center gap-4 justify-center "
                >
                  <Checkbox
                    id={rule.id}
                    checked={selectedRules.includes(rule.id)}
                    onCheckedChange={() => handleRuleSelection(rule.id)}
                    className="text-white size-5 bg-white"
                  />
                  <span>{rule.ruleName}</span>
                  {/* <span className="text-white">{rule.rule.toString()}</span> */}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <Select
                onValueChange={(value: 'AND' | 'OR') =>
                  setGlobalCondition(value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Global Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">AND</SelectItem>
                  <SelectItem value="OR">OR</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={combineRules}
                disabled={selectedRules.length !== 2}
              >
                Combine Rules
              </Button>
            </div>

            {combinedRule && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.5 }}
                className="mt-6 p-4 bg-gray-800 rounded-lg overflow-hidden"
              >
                <h2 className="text-xl font-semibold mb-2">Combined Rule:</h2>
                <p className="text-green-400 break-words">{combinedRule}</p>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}
