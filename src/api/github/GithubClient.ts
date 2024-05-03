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
     * Fetch the activity (commit count, prs, issues) of the token owner for a date range
     * @param startTime
     * @param endTime
     * @param maxEvents The maximum number of events to fetch for PRs and issues
     * @throws GraphqlResponseError
     */
    public async fetchActivityForRange(startTime: Date, endTime: Date, maxEvents: number) {
        console.log(startTime, endTime)
        const response = await this.octokit.graphql<{
            viewer: {
                contributionsCollection: {
                    issueContributions: {
                        nodes: {
                            issue: {
                                title: string,
                                repository: {},
                                createdAt: string
                            }
                        }[]
                    },
                    pullRequestContributions: {
                        nodes: {
                            pullRequest: {
                                title: string,
                                repository: {}
                                createdAt: string,
                            }
                        }[]
                    },
                    totalCommitContributions: number,
                }
            }
        }>(`
            query ($startTime: DateTime, $endTime: DateTime, $first: Int) {
                viewer {
                    contributionsCollection(from: $startTime, to: $endTime) {
                        pullRequestContributions(first: $first) {
                            nodes {
                                pullRequest {
                                    title
                                    repository {
                                        name
                                        owner {
                                            login
                                        }
                                    }
                                    createdAt
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
                                    createdAt
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
            first: maxEvents,
        })
        return response.viewer.contributionsCollection
    }

    /**
     * Fetch the activity (commit count, prs, issues) of the token owner for the current month
     * @param maxEvents The maximum number of events to fetch for PRs and issues
     * @throws GraphqlResponseError
     */
    public async fetchActivityForMonth(maxEvents: number) {
        const {startTime, endTime} = GithubClient.getMonthStartEndDates(new Date())

        return this.fetchActivityForRange(startTime, endTime, maxEvents)
    }
}
