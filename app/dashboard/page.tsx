"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getActiveElections, getPastElections, type Election } from "@/lib/firestore"
import { Loader2, Plus } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function Dashboard() {
  const { user } = useAuth()
  const [activeElections, setActiveElections] = useState<Election[]>([])
  const [pastElections, setPastElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchElections() {
      try {
        const active = await getActiveElections()
        const past = await getPastElections()
        setActiveElections(active)
        setPastElections(past)
      } catch (error) {
        console.error("Error fetching elections:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchElections()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link href="/dashboard/create-election">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Election
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Elections</TabsTrigger>
          <TabsTrigger value="past">Past Elections</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          {activeElections.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No active elections</h3>
              <p className="text-muted-foreground mt-1">Create a new election or wait for upcoming ones.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeElections.map((election) => (
                <Card key={election.id}>
                  <CardHeader>
                    <CardTitle>{election.title}</CardTitle>
                    <CardDescription>
                      Ends {formatDistanceToNow(election.endDate.toDate(), { addSuffix: true })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2">{election.description}</p>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/dashboard/election/${election.id}`} className="w-full">
                      <Button className="w-full">Vote Now</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="past">
          {pastElections.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No past elections</h3>
              <p className="text-muted-foreground mt-1">Past elections will appear here.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pastElections.map((election) => (
                <Card key={election.id}>
                  <CardHeader>
                    <CardTitle>{election.title}</CardTitle>
                    <CardDescription>
                      Ended {formatDistanceToNow(election.endDate.toDate(), { addSuffix: true })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2">{election.description}</p>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/dashboard/election/${election.id}/results`} className="w-full">
                      <Button variant="outline" className="w-full">
                        View Results
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

