/*
SPDX-FileCopyrightText: 2024 AFCMS <afcm.contact@gmail.com>
SPDX-License-Identifier: GPL-3.0-or-later
*/

import {Octokit} from "octokit"

/**
 * Handle GitHub API usage in the project
 */
export default class GithubClient {
    /**
     * The instance of the GithubClient, used to prevent creating multiple instances
     */
    private static instance: GithubClient | null = null;

    /**
     * The token used to authenticate the client, must have the `read:user` scope
     */
    private readonly token: string;

    /**
     * The octokit instance used to make requests
     */
    private readonly octokit: Octokit;

    /**
     * Create a new GithubClient instance
     * @param token
     * @private
     */
    private constructor(token: string) {
        this.token = token;
        this.octokit = new Octokit({auth: this.token})
    }

    /**
     * Get a GithubClient, prevent creating multiple instances of the client
     * @param token
     */
    public static getInstance(token?: string): GithubClient {
        if (!GithubClient.instance) {
            if (!token) {
                throw new Error("No token provided and no instance available")
            }
            GithubClient.instance = new GithubClient(token);
        }
        return GithubClient.instance;
    }

    /**
     * Get the start and end dates of a specific month or the current one
     * @param date The date to get the month start and end dates from, default to the current date
     */
    private static getMonthStartEndDates(date?: Date): { startTime: Date, endTime: Date } {
        const now = date ?? new Date()

        const startTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
        const endTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))

        return {startTime, endTime}
    }

    /**
     * Fetch the number of commits made by the token owner for a date range
     * @param startTime The start of the date range
     * @param endTime The end of the date range
     * @throws GraphqlResponseError
     */
    public async fetchCommitCountForRange(startTime: Date, endTime: Date): Promise<number> {
        const response = await this.octokit.graphql<{
            viewer: { contributionsCollection: { totalCommitContributions: number } }
        }>(`
            query ($startTime: DateTime, $endTime: DateTime) {
                viewer {
                    contributionsCollection(from: $startTime, to: $endTime) {
                        totalCommitContributions,
                    }
                }
            }
        `, {
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString()
        })

        return response.viewer.contributionsCollection.totalCommitContributions
    }

    /**
     * Fetch the number of commits made by the token owner for the current month or a specific one
     * @throws GraphqlResponseError
     */
    public async fetchCommitCountForMonth(date?: Date): Promise<number> {
        const {startTime, endTime} = GithubClient.getMonthStartEndDates(date)

        return this.fetchCommitCountForRange(startTime, endTime)
    }

    public async fetchActivityForRange(startTime: Date, endTime: Date) {
        console.log(startTime, endTime)
        const response = await this.octokit.graphql(`
            query ($startTime: DateTime, $endTime: DateTime, $first: Int) {
                viewer {
                    contributionsCollection(from: $startTime, to: $endTime) {
                        pullRequestContributions(first: $first) {
                            nodes {
                                pullRequest {
                                    title
                                    createdAt
                                    mergedAt
                                    state
                                    author {
                                        login
                                    }
                                    repository {
                                        name
                                        owner {
                                            login
                                        }
                                    }
                                }
                            }
                        },
                        issueContributions(first: $first) {
                            nodes {
                                issue {
                                    title
                                    repository {
                                        name
                                        owner {
                                            login
                                        }
                                    }
                                }
                            }
                        },
                        totalCommitContributions,
                    }
                }
                rateLimit {
                    limit
                    remaining
                    used
                    resetAt
                }
            }
        `, {
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            first: 20,
        })
        console.log(response)
    }
}
