import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'

type Rule = {
  id: string
  ruleName: string
}

export default function Eval() {
  const [rules, setRules] = useState<Rule[]>([])
  const [selectedRule, setSelectedRule] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [inputData, setInputData] = useState({
    age: '',
    department: '',
    salary: '',
    experience: '',
  })
  const [evaluationResult, setEvaluationResult] = useState<boolean | null>(null)
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputData({ ...inputData, [e.target.name]: e.target.value })
  }

  const handleRuleSelection = (ruleId: string) => {
    setSelectedRule(ruleId)
  }

  const evaluateRule = async () => {
    if (!selectedRule) {
      toast({
        title: 'Error',
        description: 'Please select a rule to evaluate.',
        variant: 'destructive',
      })
      return
    }
    console.log(inputData)
    console.log(selectedRule)
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/eval`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ruleId: selectedRule,
            data: inputData,
          }),
        }
      )
      if (!response.ok) {
        throw new Error('Failed to evaluate rule')
      }
      setEvaluationResult(true)
      toast({
        title: 'Success',
        description: 'Rule evaluated successfully!',
      })
    } catch (e) {
      console.error('Error evaluating rule:', e)
      toast({
        title: 'Error',
        description: 'Failed to evaluate rule. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-6xl mx-auto space-y-6"
      >
        <h1 className="text-3xl font-bold text-center mb-6">Rule Evaluator</h1>

        {isLoading ? (
          <p className="text-center">Loading rules...</p>
        ) : (
          <div className="flex flex-col space-y-6">
            <div className="flex space-x-6">
              {/* Rules on the left */}
              <div className="w-1/2 space-y-4">
                <h2 className="text-xl font-semibold">Available Rules</h2>
                <RadioGroup
                  value={selectedRule || ''}
                  onValueChange={handleRuleSelection}
                >
                  {rules.map((rule) => (
                    <div key={rule.id} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={rule.id}
                        id={rule.id}
                        className="bg-white"
                      />
                      <label htmlFor={rule.id}>{rule.ruleName}</label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Input on the right */}
              <div className="w-1/2 space-y-4">
                <h2 className="text-xl font-semibold">Input Data</h2>
                <div className="space-y-2">
                  <label htmlFor="age" className="block text-sm font-medium">
                    Age
                  </label>
                  <Input
                    id="age"
                    name="age"
                    placeholder="Enter age"
                    value={inputData.age}
                    onChange={handleInputChange}
                    className="text-black"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="department"
                    className="block text-sm font-medium"
                  >
                    Department
                  </label>
                  <Input
                    id="department"
                    name="department"
                    placeholder="Enter department"
                    value={inputData.department}
                    onChange={handleInputChange}
                    className="text-black"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="salary" className="block text-sm font-medium">
                    Salary
                  </label>
                  <Input
                    id="salary"
                    name="salary"
                    placeholder="Enter salary"
                    value={inputData.salary}
                    onChange={handleInputChange}
                    className="text-black"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="experience"
                    className="block text-sm font-medium"
                  >
                    Experience
                  </label>
                  <Input
                    id="experience"
                    name="experience"
                    placeholder="Enter experience"
                    value={inputData.experience}
                    onChange={handleInputChange}
                    className="text-black"
                  />
                </div>
                <Button onClick={evaluateRule} className="w-full">
                  Evaluate Selected Rule
                </Button>
              </div>
            </div>

            {/* Result below */}
            {evaluationResult !== null && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Evaluation Result</h2>
                <div className="p-4 bg-gray-800 rounded-lg flex justify-between items-center">
                  <span>
                    {rules.find((r) => r.id === selectedRule)?.ruleName}
                  </span>
                  <span
                    className={
                      evaluationResult ? 'text-green-500' : 'text-red-500'
                    }
                  >
                    {evaluationResult ? 'Passed' : 'Failed'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
