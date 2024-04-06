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
     * The token used to authenticate the client, must have the `read:user` scope
     */
    private readonly token: string;
    /**
     * The octokit instance used to make requests
     */
    private readonly octokit: Octokit;

    public constructor(token: string) {
        this.token = token;
        this.octokit = new Octokit({auth: this.token})
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
}
