import GithubClient from "./GithubClient.js";
import * as fs from "node:fs";

type GithubStateStep = {
    newCommits: number;
}

class GithubState {
    private static instance: GithubState;
    private static readonly FILE_NAME_STATE = "github-state.json";
    private previousCommitCount: number = 0;
    private ghClient: GithubClient;

    constructor(ghClient: GithubClient) {
        this.ghClient = ghClient;

        this.loadState();
    }

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

    private saveState() {
        const data = {
            previousCommitCount: this.previousCommitCount,
            currentMonth: new Date().getMonth(),
        }
        fs.writeFileSync(GithubState.FILE_NAME_STATE, JSON.stringify(data, null, 2));
    }

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