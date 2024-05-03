/*
SPDX-FileCopyrightText: 2024 AFCMS <afcm.contact@gmail.com>
SPDX-License-Identifier: GPL-3.0-or-later
*/

import * as fs from "node:fs";

import GithubClient from "./GithubClient.js";

type GithubStateStep = {
    newCommits: number;
    newIssues: string[];
    newPullRequests: string[];
}

/**
 * Class to keep track of the state of the data fetched from the Github API
 *
 * Saves the data to a file to keep track of the previous state
 */
class GithubState {
    private static instance: GithubState;
    private static readonly FILE_NAME_STATE = "github-state.json";
    private previousCommitCount: number = 0;
    private lastFetchedIssueDate: Date | undefined;
    private lastFetchedPullRequestDate: Date | undefined;
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
                throw new Error("No GithubClient provided and no instance available")
            }
            GithubState.instance = new GithubState(ghClient);
        }
        return GithubState.instance;
    }

    /**
     * Do the periodical data fetch, return the data that changed since the last fetch
     */
    public async step(): Promise<GithubStateStep> {
        const data = await this.ghClient.fetchActivityForMonth();
        const commitCount = data.totalCommitContributions;
        const newCommits = commitCount - this.previousCommitCount;
        if (newCommits > 0) {
            console.log(`New commit detected! ${commitCount} total commits`)
            this.previousCommitCount = commitCount;
        }

        const newIssues = data.issueContributions.nodes.filter((issue) => {
            return this.lastFetchedIssueDate ? new Date(issue.issue.createdAt) > this.lastFetchedIssueDate : true;
        })

        const newPullRequests = data.pullRequestContributions.nodes.filter((pr) => {
            return this.lastFetchedPullRequestDate ? new Date(pr.pullRequest.createdAt) > this.lastFetchedPullRequestDate : true;
        })

        if (newIssues.length > 0) {
            console.log(`New issues detected! ${newIssues.length} new issues`)
            this.lastFetchedIssueDate = new Date(newIssues[0].issue.createdAt);
        }

        if (newPullRequests.length > 0) {
            console.log(`New pull requests detected! ${newPullRequests.length} new pull requests`)
            this.lastFetchedPullRequestDate = new Date(newPullRequests[0].pullRequest.createdAt);
        }

        this.saveState();

        return {
            newCommits: newCommits,
            newIssues: newIssues.map(issue => JSON.stringify(issue.issue.title)),
            newPullRequests: newPullRequests.map(pr => JSON.stringify(pr.pullRequest.title))
        }
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
            lastFetchedPullRequestDate: this.lastFetchedPullRequestDate
        }
        fs.writeFileSync(GithubState.FILE_NAME_STATE, JSON.stringify(data, null, 2));
    }

    /**
     * Load the state from a file
     * @private
     */
    private loadState() {
        if (fs.existsSync(GithubState.FILE_NAME_STATE)) {
            const data = JSON.parse(fs.readFileSync(GithubState.FILE_NAME_STATE, "utf-8"));

            if (data.currentMonth === new Date().getMonth()) {
                this.previousCommitCount = data.previousCommitCount;
            }
            this.lastFetchedIssueDate = new Date(data.lastFetchedIssueDate);
            this.lastFetchedPullRequestDate = new Date(data.lastFetchedPullRequestDate);
        }
    }
}

export default GithubState;