/*
SPDX-FileCopyrightText: 2024 AFCMS <afcm.contact@gmail.com>
SPDX-License-Identifier: GPL-3.0-or-later
*/

import chalk from "chalk";
import {ReadlineParser, SerialPort} from "serialport"

type CommandName = "ping" | "log" | string

/**
 * The function definition for a command handler, playload will be an empty string if command contains no playload
 */
type CommandHandler = (commHandler: CommHandler, playload: string) => void

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
    private readonly debugLog: boolean;
    private readonly serialPort: SerialPort;
    private readonly parser: ReadlineParser
    private commandHandlers: Map<CommandName, CommandHandler>

    public constructor(path: string, debugLog: boolean = false) {
        console.log(chalk.green(`CommHandler: Opening serial port at ${path}`))

        this.commandHandlers = new Map()
        this.registerHandler("ping", CommHandler.handlerPing)
        this.registerHandler("log", CommHandler.handlerLog)

        this.debugLog = debugLog
        this.serialPort = new SerialPort({path: path, baudRate: CommHandler.BAUD_RATE})
        this.parser = new ReadlineParser()
        this.serialPort.pipe(this.parser)
        this.parser.on("data", (data) => this.handleData(data))
        this.parser.on("error", (err) => this.handleError(err))

        this.sendCommand("log", "TEST_PLAYLOAD")
    }

    /**
     * Handler for the `ping` command
     */
    private static handlerPing(commHandler: CommHandler, _: string) {
        commHandler.sendCommand("ping")
    }

    /**
     * Handler for the `log` command
     */
    private static handlerLog(_: CommHandler, playload: string) {
        const match = playload.match(/^\[([A-Z]+)] (.*)$/)

        if (match) {
            const t = match[1]
            const m = match[2]

            switch (t) {
                case "LOG":
                    console.log(chalk.yellow(`CommHandler: [${t}] ${m}`))
                    break
                case "ERROR":
                    console.log(chalk.red(`CommHandler: [${t}] ${m}`))
                    break
                case "INFO":
                    console.log(chalk.green(`CommHandler: [${t}] ${m}`))
                    break
                default:
                    console.error(chalk.red(`CommHandler: Received invalid log command: ${playload}`))
            }
        }
    }

    /**
     * Send a command to the serial port, log the command if needed
     * @param command
     * @param playload
     */
    public sendCommand(command: CommandName, playload?: string) {
        this.serialPort.write(playload ? `${command} ${playload}\n` : `${command}\n`)
        if (this.debugLog) {
            console.log(chalk.yellow(`CommHandler: Sending____: ${chalk.underline(command)} ${playload ? chalk.underline(playload) : ""}`))
        }
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Close the serial port
     */
    public close() {
        this.serialPort.close()
    }

    /**
     * Register a handler for a command
     */
    public registerHandler(commandName: CommandName, handler: CommandHandler) {
        if (this.commandHandlers.get(commandName)) {
            throw `Handler already exists for command ${commandName}`
        } else {
            this.commandHandlers.set(commandName, handler)
        }
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Unregister the handler of a command
     */
    public unregisterHandler(commandName: CommandName) {
        this.commandHandlers.delete(commandName)
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

            if (this.debugLog) {
                console.log(chalk.yellow(`CommHandler: Incomming__: ${chalk.underline(command)} ${chalk.underline(playload)}`))
            }

            const handler = this.commandHandlers.get(command)
            if (handler) {
                handler(this, playload)
            }
        } else {
            console.error(chalk.red(`CommHandler: Invalid command: [${chalk.underline(data)}]`))
        }
    }

    private handleError(err: Error) {
        console.error(chalk.red(`CommHandler: Serial error: [${chalk.underline(err)}]`))
    }
}