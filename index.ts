// deno-lint-ignore-file ban-ts-comment
// SPDX-FileCopyrightText: 2024 AFCMS <afcm.contact@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import * as dotenv from "@std/dotenv";

import * as commander from "commander";
import chalk from "chalk";

import GithubClient from "./src/api/github/GithubClient.ts";
import GithubState from "./src/api/github/GithubState.ts";
import SpotifyClient from "./src/api/spotify/SpotifyClient.ts";
import CommHandler from "./src/CommHandler.ts";

const splashScreen =
    `╔════════════════════════════════════╗                      
║     ____            ____       __  ║                      
║    / __ \\___ _   __/ __ \\___  / /_ ║                      
║   / / / / _ \\ | / / /_/ / _ \\/ __/ ║                      
║  / /_/ /  __/ |/ / ____/  __/ /_   ║                      
║ /_____/\\___/|___/_/    \\___/\\__/   ║                      
║                            Backend ║                      
╚════════════════════════════════════╝`;

// Load .env file
const env = dotenv.loadSync();

for (const key in env) {
    Deno.env.set(key, env[key]);
}

const program = new commander.Command();

program
    .name("DevPet Backend")
    .description(
        "DevPet NodeJS Backend, handle serial communication, data retriving/processing and more",
    );

program
    .command("run")
    .description("Run backend")
    .action(async () => {
        console.log(chalk.green(splashScreen));
        console.log(`Running script with args`);
        const ghClient = GithubClient.getInstance(
            Deno.env.get("DEVPET_GITHUB_TOKEN"),
        );
        const ghState = GithubState.getInstance(ghClient);
        const spClient = SpotifyClient.getInstance(
            Deno.env.get("DEVPET_SPOTIFY_CLIENT_ID"),
            Deno.env.get("DEVPET_SPOTIFY_CLIENT_SECRET"),
        );
        const commHandler = new CommHandler(
            Deno.env.get("DEVPET_SERIAL_PORT") as string,
            true,
        );

        setInterval(async () => {
            // Spotify playing track
            const track = await spClient.getPlayingTrack();
            if (track && track.is_playing) {
                // @ts-ignore
                commHandler.sendCommand(
                    "music-play",
                    track.item.name + "^" +
                    // @ts-ignore
                        track.item.artists.map((a) => a.name).join(", "),
                );
            }

            // GitHub last events (issues, prs, commits)
            const ghStep = await ghState.step();
            for (const newIssuesKey in ghStep.newIssues) {
                commHandler.sendCommand(
                    "new-issue",
                    ghStep.newIssues[newIssuesKey],
                );
            }
            for (const newPRsKey in ghStep.newPullRequests) {
                commHandler.sendCommand(
                    "new-pr",
                    ghStep.newPullRequests[newPRsKey],
                );
            }
            if (ghStep.newCommits > 0) {
                commHandler.sendCommand(
                    "new-commits",
                    ghStep.newCommits.toString(),
                );
            }
        }, 10 * 1000);

        /*setInterval(async () => {
            commHandler.sendCommand("new-issue", "Some new issue appeared")
        }, 10 * 1000)*/

        /*setTimeout(() => {
            console.log(handler.commandQueue)
            handler.close()
        }, 5000)*/
    });

program
    .command("log")
    .description(
        "Just log serial port data (no data sending except ping and log commands)",
    )
    .action(() => {
        console.log(chalk.green(splashScreen));
        new CommHandler(Deno.env.get("DEVPET_SERIAL_PORT") as string, true);
    });

program
    .command("github-test")
    .description("Test the GitHub API queries")
    .action(() => {
        console.log(chalk.green(splashScreen));
        const ghClient = GithubClient.getInstance(
            Deno.env.get("DEVPET_GITHUB_TOKEN"),
        );
        const ghState = GithubState.getInstance(ghClient);

        setInterval(async () => {
            console.log(await ghState.step());
        }, 10 * 1000);
    });

program
    .command("spotify-test")
    .description("Test the Spotify API queries")
    .action(() => {
        console.log(chalk.green(splashScreen));
        const spClient = SpotifyClient.getInstance(
            Deno.env.get("DEVPET_SPOTIFY_CLIENT_ID"),
            Deno.env.get("DEVPET_SPOTIFY_CLIENT_SECRET"),
        );
        setInterval(async () => {
            console.log(await spClient.getPlayingTrack());
        }, 10 * 1000);
    });

program
    .command("spotify-login")
    .description("Start the Spotify OAuth2 login flow")
    .action(async () => {
        console.log(chalk.green(splashScreen));
        const spClient = SpotifyClient.getInstance(
            Deno.env.get("DEVPET_SPOTIFY_CLIENT_ID"),
            Deno.env.get("DEVPET_SPOTIFY_CLIENT_SECRET"),
        );
        await spClient.refreshTokenFlow();
    });

program.parse();
