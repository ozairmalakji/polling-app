import { collection, addDoc, getDocs, getDoc, doc, query, where, Timestamp, serverTimestamp } from "firebase/firestore"
import { db } from "./firebase"

export type Election = {
  id?: string
  title: string
  description: string
  options: string[]
  createdBy: string
  startDate: Timestamp
  endDate: Timestamp
  createdAt: Timestamp
  isActive: boolean
}

export type Vote = {
  electionId: string
  optionIndex: number
  userId: string
  timestamp: Timestamp
}

// Create a new election
export async function createElection(election: Omit<Election, "id" | "createdAt">) {
  try {
    console.log("Creating election:", election);
    const docRef = await addDoc(collection(db, "elections"), {
      ...election,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating election:", error)
    throw error
  }
}

// Get all active elections
export async function getActiveElections() {
  try {
    const now = Timestamp.now()
    const q = query(
      collection(db, "elections"),
      where("startDate", "<=", now),
      where("endDate", ">=", now),
      where("isActive", "==", true),
    )

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Election[]
  } catch (error) {
    console.error("Error getting active elections:", error)
    throw error
  }
}

// Get all past elections
export async function getPastElections() {
  try {
    const now = Timestamp.now()
    const q = query(collection(db, "elections"), where("endDate", "<", now))

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Election[]
  } catch (error) {
    console.error("Error getting past elections:", error)
    throw error
  }
}

// Get elections created by a user
export async function getUserElections(userId: string) {
  try {
    const q = query(collection(db, "elections"), where("createdBy", "==", userId))

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Election[]
  } catch (error) {
    console.error("Error getting user elections:", error)
    throw error
  }
}

// Get a single election by ID
export async function getElection(id: string) {
  try {
    const docRef = doc(db, "elections", id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Election
    } else {
      throw new Error("Election not found")
    }
  } catch (error) {
    console.error("Error getting election:", error)
    throw error
  }
}

// Cast a vote in an election
export async function castVote(vote: Omit<Vote, "timestamp">) {
  try {
    // Check if user has already voted
    const q = query(
      collection(db, "votes"),
      where("electionId", "==", vote.electionId),
      where("userId", "==", vote.userId),
    )

    const querySnapshot = await getDocs(q)
    if (!querySnapshot.empty) {
      throw new Error("You have already voted in this election")
    }

    // Add the vote
    await addDoc(collection(db, "votes"), {
      ...vote,
      timestamp: serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error casting vote:", error)
    throw error
  }
}

// Get results for an election
export async function getElectionResults(electionId: string) {
  try {
    const q = query(collection(db, "votes"), where("electionId", "==", electionId))

    const querySnapshot = await getDocs(q)
    const votes = querySnapshot.docs.map((doc) => doc.data() as Vote)

    // Count votes for each option
    const results: Record<number, number> = {}
    votes.forEach((vote) => {
      results[vote.optionIndex] = (results[vote.optionIndex] || 0) + 1
    })

    return results
  } catch (error) {
    console.error("Error getting election results:", error)
    throw error
  }
}

// Check if a user has voted in an election
export async function hasUserVoted(electionId: string, userId: string) {
  try {
    const q = query(collection(db, "votes"), where("electionId", "==", electionId), where("userId", "==", userId))

    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty
  } catch (error) {
    console.error("Error checking if user voted:", error)
    throw error
  }
}

