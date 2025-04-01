"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { getElection, castVote, hasUserVoted, type Election } from "@/lib/firestore"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ArrowLeft } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

export default function ElectionPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [election, setElection] = useState<Election | null>(null)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchElection() {
      try {
        const electionData = await getElection(id as string)
        setElection(electionData)

        if (user) {
          const voted = await hasUserVoted(id as string, user.uid)
          setHasVoted(voted)
        }
      } catch (error) {
        console.error("Error fetching election:", error)
        toast({
          title: "Error",
          description: "Failed to load election",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchElection()
  }, [id, user, toast])

  const handleVote = async () => {
    if (!user || !election || selectedOption === null) return

    try {
      setIsSubmitting(true)

      await castVote({
        electionId: id as string,
        optionIndex: selectedOption,
        userId: user.uid,
      })

      setHasVoted(true)

      toast({
        title: "Success",
        description: "Your vote has been recorded",
      })
    } catch (error: any) {
      console.error("Error casting vote:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to cast vote",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isElectionActive = () => {
    if (!election) return false

    const now = new Date()
    const start = election.startDate.toDate()
    const end = election.endDate.toDate()

    return now >= start && now <= end && election.isActive
  }

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

  const isActive = isElectionActive()
  const now = new Date()
  const hasEnded = now > election.endDate.toDate()

  return (
    <div className="container py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{election.title}</h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{election.title}</CardTitle>
          <CardDescription>
            {hasEnded
              ? `Ended ${formatDistanceToNow(election.endDate.toDate(), { addSuffix: true })}`
              : isActive
                ? `Ends ${formatDistanceToNow(election.endDate.toDate(), { addSuffix: true })}`
                : `Starts ${formatDistanceToNow(election.startDate.toDate(), { addSuffix: true })}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{election.description}</p>

          {hasEnded ? (
            <div className="bg-muted p-4 rounded-md">
              <p className="font-medium">This election has ended</p>
              <p className="text-sm text-muted-foreground mt-1">You can view the results below.</p>
              <Button asChild className="mt-4">
                <Link href={`/dashboard/election/${id}/results`}>View Results</Link>
              </Button>
            </div>
          ) : !isActive ? (
            <div className="bg-muted p-4 rounded-md">
              <p className="font-medium">This election hasn't started yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Come back {formatDistanceToNow(election.startDate.toDate(), { addSuffix: true })} to cast your vote.
              </p>
            </div>
          ) : hasVoted ? (
            <div className="bg-muted p-4 rounded-md">
              <p className="font-medium">You have already voted in this election</p>
              <p className="text-sm text-muted-foreground mt-1">Results will be available when the election ends.</p>
            </div>
          ) : (
            <RadioGroup
              value={selectedOption?.toString()}
              onValueChange={(value) => setSelectedOption(Number.parseInt(value))}
            >
              {election.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </CardContent>
        {isActive && !hasVoted && !hasEnded && (
          <CardFooter>
            <Button className="w-full" onClick={handleVote} disabled={selectedOption === null || isSubmitting}>
              {isSubmitting ? "Submitting..." : "Cast Vote"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

