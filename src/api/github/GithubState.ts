/*
SPDX-FileCopyrightText: 2024 AFCMS <afcm.contact@gmail.com>
SPDX-License-Identifier: GPL-3.0-or-later
*/

import * as fs from "@std/fs";

import GithubClient from "./GithubClient.ts";

/**
 * The data returned by the GithubState.step method
 *
 * @see GithubState.step
 */
type GithubStateStep = {
    newCommits: number;
    newIssues: string[];
    newPullRequests: string[];
    rateLimit: {
        limit: number;
        remaining: number;
        used: number;
        resetAt: string;
    };
};

/**
 * Class to keep track of the state of the data fetched from the Github API
 *
 * Saves the data to a file to keep track of the previous state
 */
class GithubState {
    /**
     * The instance of the GithubState, used to prevent creating multiple instances
     */
    private static instance: GithubState;

    /**
     * The file name to save the state to
     * @private
     */
    private static readonly FILE_NAME_STATE = "github-state.json";

    /**
     * The maximum number of events to fetch for PRs and issues
     *
     * Should reflect the maximum amount of events that can be fetched in a single request
     * @private
     */
    private static readonly MAX_EVENT_COUNT = 20;

    /**
     * The previous commit count
     * @private
     */
    private previousCommitCount: number = 0;

    /**
     * The last fetched issue date
     * @private
     */
    private lastFetchedIssueDate: Date | undefined;

    /**
     * The last fetched pull request date
     * @private
     */
    private lastFetchedPullRequestDate: Date | undefined;

    /**
     * The GithubClient instance to fetch data
     * @private
     */
    private ghClient: GithubClient;

    /**
     * Create a new GithubState instance
     */
    private constructor(ghClient: GithubClient) {
        this.ghClient = ghClient;

        this.loadState();
    }

    /**
     * Get the GithubState instance, prevent creating multiple instances of the state
     * @param ghClient
     */
    public static getInstance(ghClient: GithubClient): GithubState {
        if (!GithubState.instance) {
            if (!ghClient) {
                throw new Error(
                    "No GithubClient provided and no instance available",
                );
            }
            GithubState.instance = new GithubState(ghClient);
        }
        return GithubState.instance;
    }

    /**
     * Do the periodical data fetch, return the data that changed since the last fetch
     *
     * Should typically be called at a regular interval to send data to the pet over serial
     * @see CommHandler
     * @throws GraphqlResponseError
     */
    public async step(): Promise<GithubStateStep> {
        const data = await this.ghClient.fetchActivityForMonth(
            GithubState.MAX_EVENT_COUNT,
        );
        const commitCount = data.totalCommitContributions;
        const newCommits = commitCount - this.previousCommitCount;
        if (newCommits > 0) {
            console.log(`New commit detected! ${commitCount} total commits`);
            this.previousCommitCount = commitCount;
        }

        const newIssues = data.issueContributions.nodes.filter((issue) => {
            return this.lastFetchedIssueDate
                ? new Date(issue.issue.createdAt) > this.lastFetchedIssueDate
                : true;
        });

        const newPullRequests = data.pullRequestContributions.nodes.filter(
            (pr) => {
                return this.lastFetchedPullRequestDate
                    ? new Date(pr.pullRequest.createdAt) >
                        this.lastFetchedPullRequestDate
                    : true;
            },
        );

        if (newIssues.length > 0) {
            console.log(`New issues detected! ${newIssues.length} new issues`);
            this.lastFetchedIssueDate = new Date(newIssues[0].issue.createdAt);
        }

        if (newPullRequests.length > 0) {
            console.log(
                `New pull requests detected! ${newPullRequests.length} new pull requests`,
            );
            this.lastFetchedPullRequestDate = new Date(
                newPullRequests[0].pullRequest.createdAt,
            );
        }

        this.saveState();

        // TODO: cleanup titles from Markdown stuff

        return {
            newCommits: newCommits,
            newIssues: newIssues.map((issue) =>
                JSON.stringify(issue.issue.title.replace("`", ""))
            ),
            newPullRequests: newPullRequests.map((pr) =>
                JSON.stringify(pr.pullRequest.title)
            ),
            rateLimit: data.rateLimit,
        };
    }

    /**
     * Save the current state to a file
     * @private
     */
    private saveState() {
        const data = {
            previousCommitCount: this.previousCommitCount,
            currentMonth: new Date().getMonth(),
            lastFetchedIssueDate: this.lastFetchedIssueDate,
            lastFetchedPullRequestDate: this.lastFetchedPullRequestDate,
        };

        Deno.writeTextFileSync(
            GithubState.FILE_NAME_STATE,
            JSON.stringify(data, null, 2),
        );
    }

    /**
     * Load the state from a file
     * @private
     */
    private loadState() {
        if (fs.existsSync(GithubState.FILE_NAME_STATE)) {
            const data = JSON.parse(
                Deno.readTextFileSync(GithubState.FILE_NAME_STATE),
            );

            if (data.currentMonth === new Date().getMonth()) {
                this.previousCommitCount = data.previousCommitCount;
            }
            this.lastFetchedIssueDate = new Date(data.lastFetchedIssueDate);
            this.lastFetchedPullRequestDate = new Date(
                data.lastFetchedPullRequestDate,
            );
        }
    }
}

export default GithubState;
