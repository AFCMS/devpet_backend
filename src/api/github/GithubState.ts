import * as path from "node:path";

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
    }

    public async step(): Promise<GithubStateStep> {
        const commitCount = await this.ghClient.fetchCommitCountForMonth();
        const newCommits = commitCount - this.previousCommitCount;
        if (newCommits > 0) {
            console.log(`New commit detected! ${commitCount} total commits`)
            this.previousCommitCount = commitCount;
        }
        return {
            newCommits: newCommits
        }
    }

    private saveState() {
        const data = {}
        fs.writeFileSync(path.resolve(__dirname, GithubState.FILE_NAME_STATE), JSON.stringify(data, null, 2));
    }

    private loadState() {
        const fpath = path.resolve(__dirname, GithubState.FILE_NAME_STATE);
        if (fs.existsSync(fpath)) {
            const data = JSON.parse(fs.readFileSync(fpath, "utf-8"));
        }
    }
}

export default GithubState;