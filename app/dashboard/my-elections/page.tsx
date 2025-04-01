"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserElections, type Election } from "@/lib/firestore"
import { Loader2, Plus, ArrowLeft } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function MyElectionsPage() {
  const { user } = useAuth()
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchElections() {
      if (!user) return

      try {
        const userElections = await getUserElections(user.uid)
        setElections(userElections)
      } catch (error) {
        console.error("Error fetching elections:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchElections()
  }, [user])

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">My Elections</h1>
        <div className="ml-auto">
          <Link href="/dashboard/create-election">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Election
            </Button>
          </Link>
        </div>
      </div>

      {elections.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No elections created</h3>
          <p className="text-muted-foreground mt-1">You haven't created any elections yet.</p>
          <Link href="/dashboard/create-election">
            <Button className="mt-4">Create Your First Election</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {elections.map((election) => {
            const now = new Date()
            const hasStarted = now >= election.startDate.toDate()
            const hasEnded = now > election.endDate.toDate()

            return (
              <Card key={election.id}>
                <CardHeader>
                  <CardTitle>{election.title}</CardTitle>
                  <CardDescription>
                    {hasEnded
                      ? `Ended ${formatDistanceToNow(election.endDate.toDate(), { addSuffix: true })}`
                      : hasStarted
                        ? `Ends ${formatDistanceToNow(election.endDate.toDate(), { addSuffix: true })}`
                        : `Starts ${formatDistanceToNow(election.startDate.toDate(), { addSuffix: true })}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2">{election.description}</p>
                  <div className="mt-2 text-sm text-muted-foreground">{election.options.length} options</div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Link href={`/dashboard/election/${election.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View
                    </Button>
                  </Link>
                  {hasEnded && (
                    <Link href={`/dashboard/election/${election.id}/results`} className="flex-1">
                      <Button className="w-full">Results</Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

