// SPDX-FileCopyrightText: 2024 AFCMS <afcm.contact@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import readline from 'node:readline';

import "dotenv/config"
import * as commander from "commander"
import chalk from "chalk";

import CommHandler from "./src/CommHandler";
import GithubClient from "./src/api/github/GithubClient";
import GithubState from "./src/api/github/GithubState";
import SpotifyClient from "./src/api/spotify/SpotifyClient";
import {PlaybackState} from "@spotify/web-api-ts-sdk";

const splashScreen = `╔════════════════════════════════════╗                      
║     ____            ____       __  ║                      
║    / __ \\___ _   __/ __ \\___  / /_ ║                      
║   / / / / _ \\ | / / /_/ / _ \\/ __/ ║                      
║  / /_/ /  __/ |/ / ____/  __/ /_   ║                      
║ /_____/\\___/|___/_/    \\___/\\__/   ║                      
║                            Backend ║                      
╚════════════════════════════════════╝`

process.on("SIGINT", function () {
    process.exit();
});

const program = new commander.Command()


program
    .name("DevPet Backend")
    .description("DevPet NodeJS Backend, handle serial communication, data retriving/processing and more")

program
    .command("run")
    .description("Run backend")
    .option("-d, --debug", "Enable debug logs", false)
    .action(async (options: { debug: boolean }) => {
        console.log(chalk.green(splashScreen))
        const ghClient = GithubClient.getInstance(process.env.DEVPET_GITHUB_TOKEN)
        const ghState = GithubState.getInstance(ghClient)
        const spClient = SpotifyClient.getInstance(process.env.DEVPET_SPOTIFY_CLIENT_ID, process.env.DEVPET_SPOTIFY_CLIENT_SECRET)
        const handler = new CommHandler(process.env.DEVPET_SERIAL_PORT, options.debug)

        // Fetch data every 10s
        setInterval(async () => {
            const ghStep = await ghState.step()

            // Spotify SDK sucks
            let spPlaying: PlaybackState | undefined
            try {
                spPlaying = await spClient.getPlayingTrack()
            } catch (TypeError) {
                spPlaying = undefined
            }

            // Log all important data

            console.log(chalk.green(`
========= Sending Data ==========
GitHub:
- New commits: ${ghStep.newCommits}
- New issues: ${ghStep.newIssues.length}
- New pull requests: ${ghStep.newPullRequests.length}
- Rate limit: ${ghStep.rateLimit.remaining}/${ghStep.rateLimit.limit} (reset at ${ghStep.rateLimit.resetAt})

Spotify:
- Playing: ${spPlaying && spPlaying.is_playing ? `${spPlaying.item.name} by ${
                // @ts-expect-error Spotify SDK sucks
                spPlaying.item.artists.map((a: { name: string }) => a.name).join(", ")
            }` : "Nothing"}
=================================
`))

            if (ghStep.newCommits > 0) {
                handler.sendCommand("new-commits", ghStep.newCommits.toString())
            }

            if (ghStep.newIssues.length > 0) {
                for (const issue of ghStep.newIssues) {
                    handler.sendCommand("new-issue", issue)
                }
            }

            if (ghStep.newPullRequests.length > 0) {
                for (const pr of ghStep.newPullRequests) {
                    handler.sendCommand("new-pr", pr)
                }
            }

            if (spPlaying && spPlaying.is_playing) {
                // @ts-expect-error Spotify SDK sucks
                handler.sendCommand("music-play", `${spPlaying.item.name}^${spPlaying.item.artists.map((a: {
                    name: string
                }) => a.name).join(", ")}`)
            }
        }, 10 * 1000)

        // Refresh Spotify token every 30mn (the token should expire every 1h)
        setInterval(async () => {
            await spClient.doRefreshToken()
        }, 30 * 60 * 1000)
    })

program
    .command("run-test")
    .description("Run backend with fake GitHub data")
    .option("-s, --spotify", "Enable real Spotify data", false)
    .action(async (options: { spotify: boolean }) => {
        console.log(chalk.green(splashScreen))
        const spClient = SpotifyClient.getInstance(process.env.DEVPET_SPOTIFY_CLIENT_ID, process.env.DEVPET_SPOTIFY_CLIENT_SECRET)
        const handler = new CommHandler(process.env.DEVPET_SERIAL_PORT, false)

        if (options.spotify) {
            // Fetch only Spotify data
            setInterval(async () => {
                // Spotify SDK sucks
                let spPlaying: PlaybackState | undefined
                try {
                    spPlaying = await spClient.getPlayingTrack()
                } catch (TypeError) {
                    spPlaying = undefined
                }

                if (spPlaying && spPlaying.is_playing) {
                    // @ts-expect-error Spotify SDK sucks
                    handler.sendCommand("music-play", `${spPlaying.item.name}^${spPlaying.item.artists.map((a: {
                        name: string
                    }) => a.name).join(", ")}`)
                }
            }, 10 * 1000)

            // Refresh Spotify token every 30mn (the token should expire every 1h)
            setInterval(async () => {
                await spClient.doRefreshToken()
            }, 30 * 60 * 1000)
        }

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        })

        const recursiveAsyncAskCommand = function () {
            rl.question('', function (data) {
                const match = data.trim().match(/([a-z_-]+)(?:\s+(.*))?$/);
                console.log("'" + data + "'")
                if (match) {
                    const command = match[1]
                    const payload = match[2] ?? ""
                    handler.sendCommand(command, payload)
                }

                console.log(match)

                recursiveAsyncAskCommand(); // Apparently can't cause a stack overflow for some reason, JS is weird
            });
        };

        recursiveAsyncAskCommand()
    })

program
    .command("github-test")
    .description("Test the GitHub API queries")
    .action(async () => {
        console.log(chalk.green(splashScreen))
        const ghClient = GithubClient.getInstance(process.env.DEVPET_GITHUB_TOKEN)
        const ghState = GithubState.getInstance(ghClient)

        setInterval(async () => {
            console.log(await ghState.step());
        }, 10 * 1000)
    })

program
    .command("spotify-test")
    .description("Test the Spotify API queries")
    .action(async () => {
        console.log(chalk.green(splashScreen))
        const spClient = SpotifyClient.getInstance(process.env.DEVPET_SPOTIFY_CLIENT_ID, process.env.DEVPET_SPOTIFY_CLIENT_SECRET)
        setInterval(async () => {
            console.log(await spClient.getPlayingTrack())
        }, 10 * 1000)
    })

program
    .command("spotify-login")
    .description("Start the Spotify OAuth2 login flow")
    .option("-n, --no-browser", "Do not open the browser")
    .action(async (options: { browser: boolean }) => {
        console.log(chalk.green(splashScreen))
        const spClient = SpotifyClient.getInstance(process.env.DEVPET_SPOTIFY_CLIENT_ID, process.env.DEVPET_SPOTIFY_CLIENT_SECRET)
        await spClient.refreshTokenFlow(options.browser)
    })

program.parse(process.argv);
