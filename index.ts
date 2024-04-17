// SPDX-FileCopyrightText: 2024 AFCMS <afcm.contact@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import "dotenv/config"
import * as commander from "commander"
import GithubClient from "./src/api/github/GithubClient.js";
import CommHandler from "./src/CommHandler.js";

const program = new commander.Command()

program
    .name("DevPet Backend")
    .description("DevPet NodeJS Backend, handle serial communication, data retriving/processing and more")
    .command("run").description("Run script")
    .argument("<script>")
    .action((script) => {
        console.log(`Running script with args ${script}`)
        const handler = new CommHandler("/dev/rfcomm0", true)

        /*setTimeout(() => {
            console.log(handler.commandQueue)
            handler.close()
        }, 5000)*/
    })

program
    .command("test")
    .description("Testing command")
    .action(async () => {
        console.log("Testing command")
        const gh_client = new GithubClient(process.env.GITHUB_TOKEN)
        console.log(await gh_client.fetchCommitCountForMonth())
    })

program.parse(process.argv);
