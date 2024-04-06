/*
SPDX-FileCopyrightText: 2024 AFCMS <afcm.contact@gmail.com>
SPDX-License-Identifier: GPL-3.0-or-later
*/
import "dotenv/config"
import * as commander from "commander"
import {SerialPort, ReadlineParser} from "serialport"


import TestGithub from "./src/fetch_github.js"
import CommHandler from "./src/CommHandler.js"
import chalk from "chalk";

const program = new commander.Command()

program
        .name("DevPet Backend")
        .description("DevPet NodeJS Backend, handle serial communication, data retriving/processing and more")
        .command("run").description("Run script")
        .argument("<script>")
        .action((script) => {
            console.log(`Running script with args ${script}`)
            const handler = new CommHandler()
        })

program
        .command("test")
        .description("Testing command")
        .action(async () => {
            console.log("Testing command")
            await TestGithub()
        })

program.parse(process.argv);

/*
const SERIAL_BAUD = 9600

enum LogMessageType {
    LOG,
    ERROR,
    INFO
}

const serialport = new SerialPort({path: "/dev/rfcomm0", baudRate: SERIAL_BAUD})
const parser = new ReadlineParser()
serialport.pipe(parser)
parser.on('data', console.log)
serialport.write("log TEST_PLAYLOAD\n")
*/
