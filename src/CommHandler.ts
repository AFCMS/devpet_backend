/*
SPDX-FileCopyrightText: 2024 AFCMS <afcm.contact@gmail.com>
SPDX-License-Identifier: GPL-3.0-or-later
*/

import chalk from "chalk";
import {ReadlineParser, SerialPort} from "serialport"

type Command = {
    command: string,
    playload: string
}

/**
 * Class to handle serial communication with the ESP32
 */
export default class CommHandler {
    /**
     * The baud rate used by the serial connection
     */
    private static BAUD_RATE: number = 9600
    /**
     * The pattern matching a command for use on the trimmed output of ReadlinePerser
     *
     * A command is something like this `command_name Some Command Data`
     * @see ReadlineParser
     */
    private static COMMAND_REGEX = /^([a-z_]+)(?:\s+(.*))?$/;
    public commandQueue: Array<Command> = []
    private readonly debugLog: boolean;
    private readonly serialPort: SerialPort;
    private readonly parser: ReadlineParser

    public constructor(path: string, debugLog: boolean = false) {
        console.log(chalk.green(`CommHandler: Opening serial port at ${path}`))

        this.debugLog = debugLog
        this.serialPort = new SerialPort({path: path, baudRate: CommHandler.BAUD_RATE})
        this.parser = new ReadlineParser()
        this.serialPort.pipe(this.parser)
        this.parser.on("data", (data) => this.handleData(data))
        this.parser.on("error", (err) => this.handleError(err))

        this.sendCommand("log", "TEST_PLAYLOAD")
    }

    /**
     * Send a command to the serial port, log the command if needed
     * @param command
     * @param playload
     */
    public sendCommand(command: string, playload: string) {
        this.serialPort.write(`${command} ${playload}\n`)
        if (this.debugLog) {
            console.log(chalk.yellow(`CommHandler: Sending____: ${chalk.underline(command)} ${chalk.underline(playload)}`))
        }
    }

    /**
     * Close the serial port
     */
    public close() {
        this.serialPort.close()
    }

    /**
     * Match a command from a string, log the command on sucess/failure if needed
     * @see Command
     * @see COMMAND_REGEX
     */
    private handleData(data: string) {
        data = data.trim()
        const match = data.match(CommHandler.COMMAND_REGEX)

        if (match) {
            const command = match[1]
            const playload = match[2] ?? ""
            this.commandQueue.push({command, playload})
            if (this.debugLog) {
                console.log(chalk.yellow(`CommHandler: Incomming__: ${chalk.underline(command)} ${chalk.underline(playload)}`))
            }
        } else {
            console.error(chalk.red(`CommHandler: Invalid command: [${chalk.underline(data)}]`))
        }
        //this.commandQueue.push()
        //this.commandQueue.shift()
    }

    private handleError(err: Error) {
        console.error(chalk.red(`CommHandler: Serial error: [${chalk.underline(err)}]`))
    }
}