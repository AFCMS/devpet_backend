// SPDX-FileCopyrightText: 2024 AFCMS <afcm.contact@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import "dotenv/config"
import * as commander from "commander"
import chalk from "chalk";

import GithubClient from "./src/api/github/GithubClient";
import GithubState from "./src/api/github/GithubState";
import SpotifyClient from "./src/api/spotify/SpotifyClient";

const splashScreen = `╔════════════════════════════════════╗                      
║     ____            ____       __  ║                      
║    / __ \\___ _   __/ __ \\___  / /_ ║                      
║   / / / / _ \\ | / / /_/ / _ \\/ __/ ║                      
║  / /_/ /  __/ |/ / ____/  __/ /_   ║                      
║ /_____/\\___/|___/_/    \\___/\\__/   ║                      
║                            Backend ║                      
╚════════════════════════════════════╝`

const program = new commander.Command()

program
    .name("DevPet Backend")
    .description("DevPet NodeJS Backend, handle serial communication, data retriving/processing and more")

program
    .command("run")
    .description("Run backend")
    .action(async () => {
        console.log(chalk.green(splashScreen))
        console.log(`Running script with args`)
        const ghClient = GithubClient.getInstance(process.env.DEVPET_GITHUB_TOKEN)
        const ghState = GithubState.getInstance(ghClient)
        // const spClient = SpotifyClient.getInstance(process.env.DEVPET_SPOTIFY_CLIENT_ID, process.env.DEVPET_SPOTIFY_CLIENT_SECRET)
        //new CommHandler(process.env.DEVPET_SERIAL_PORT, true)

        setInterval(async () => {
            console.log(await ghState.step());
        }, 10 * 1000)

        /*setTimeout(() => {
            console.log(handler.commandQueue)
            handler.close()
        }, 5000)*/
    })

program
    .command("simulate")
    .description("Run simulation backend (no real data)")
    .action(async () => {
        console.log(chalk.green(splashScreen))
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
    .action(async () => {
        console.log(chalk.green(splashScreen))
        const spClient = SpotifyClient.getInstance(process.env.DEVPET_SPOTIFY_CLIENT_ID, process.env.DEVPET_SPOTIFY_CLIENT_SECRET)
        await spClient.refreshTokenFlow()
    })

program.parse(process.argv);
