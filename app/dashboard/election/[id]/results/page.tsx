"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getElection, getElectionResults, type Election } from "@/lib/firestore"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ArrowLeft } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

export default function ElectionResultsPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const [election, setElection] = useState<Election | null>(null)
  const [results, setResults] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchElectionAndResults() {
      try {
        const electionData = await getElection(id as string)
        setElection(electionData)

        const resultsData = await getElectionResults(id as string)
        setResults(resultsData)
      } catch (error) {
        console.error("Error fetching election results:", error)
        toast({
          title: "Error",
          description: "Failed to load election results",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchElectionAndResults()
  }, [id, toast])

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!election) {
    return (
      <div className="container py-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">Election not found</h3>
          <p className="text-muted-foreground mt-1">The election you're looking for doesn't exist.</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  const now = new Date()
  const hasEnded = now > election.endDate.toDate()

  // Calculate total votes
  const totalVotes = Object.values(results).reduce((sum, count) => sum + count, 0)

  // Sort options by vote count (descending)
  const sortedOptions = election.options
    .map((option, index) => ({
      option,
      index,
      votes: results[index] || 0,
    }))
    .sort((a, b) => b.votes - a.votes)

  return (
    <div className="container py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Election Results</h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{election.title}</CardTitle>
          <CardDescription>
            {hasEnded
              ? `Ended ${formatDistanceToNow(election.endDate.toDate(), { addSuffix: true })}`
              : `Results will be final ${formatDistanceToNow(election.endDate.toDate(), { addSuffix: true })}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{election.description}</p>

          {!hasEnded && (
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
              <p className="font-medium text-yellow-800 dark:text-yellow-300">This election is still in progress</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                These are preliminary results and may change until the election ends.
              </p>
            </div>
          )}

          <div className="space-y-4 mt-4">
            <h3 className="font-medium">Total Votes: {totalVotes}</h3>

            {sortedOptions.map(({ option, index, votes }) => {
              const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0

              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between">
                    <span>{option}</span>
                    <span>
                      {votes} votes ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

