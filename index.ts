// SPDX-FileCopyrightText: 2024 AFCMS <afcm.contact@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import "dotenv/config"
import * as commander from "commander"
import chalk from "chalk";

import GithubClient from "./src/api/github/GithubClient.js";
import CommHandler from "./src/CommHandler.js";

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
        const handler = new CommHandler(process.env.DEVPET_SERIAL_PORT, true)

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
    .command("test")
    .description("Test the API queries")
    .action(async () => {
        console.log(chalk.green(splashScreen))
        const gh_client = new GithubClient(process.env.DEVPET_GITHUB_TOKEN)
        console.log(await gh_client.fetchCommitCountForMonth())
    })

program.parse(process.argv);
