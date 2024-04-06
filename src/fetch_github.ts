import {Octokit} from "octokit"
import type {GraphQlQueryResponseData} from "@octokit/graphql"
import {GraphqlResponseError} from "@octokit/graphql"

export default async function () {
    try {
        const octokit = new Octokit({auth: process.env.GITHUB_TOKEN})

        const now = new Date()

        const startTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
        const endTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)).toISOString()

        const response: GraphQlQueryResponseData = await octokit.graphql(`
            query ($startTime: DateTime, $endTime: DateTime) {
                viewer {
                    contributionsCollection(from: $startTime, to: $endTime) {
                        totalCommitContributions,
                    }
                }
            }
        `, {
            startTime, endTime
        })

        console.log(`Commits :`, response.viewer.contributionsCollection.totalCommitContributions)
    } catch (error) {
        if (error instanceof GraphqlResponseError) {
            console.error(`Failed to fetch contributionsCollection: ${error}`)
            throw error
        } else {
            console.error('Something went wrong…')
            throw error
        }
    }
}
