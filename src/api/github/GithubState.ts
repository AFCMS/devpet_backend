/*
SPDX-FileCopyrightText: 2024 AFCMS <afcm.contact@gmail.com>
SPDX-License-Identifier: GPL-3.0-or-later
*/

import * as fs from "node:fs";

import GithubClient from "./GithubClient.js";

type GithubStateStep = {
    newCommits: number;
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
        const commitCount = await this.ghClient.fetchCommitCountForMonth();
        const newCommits = commitCount - this.previousCommitCount;
        if (newCommits > 0) {
            console.log(`New commit detected! ${commitCount} total commits`)
            this.previousCommitCount = commitCount;
        }

        this.saveState();

        return {
            newCommits: newCommits
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
        }
    }
}

export default GithubState;