/*
SPDX-FileCopyrightText: 2024 AFCMS <afcm.contact@gmail.com>
SPDX-License-Identifier: GPL-3.0-or-later
*/

import chalk from "chalk";
import {SerialPort, ReadlineParser} from "serialport"

type Command = {
    command: string,
    playload: string
}

/**
 * Class to handle serial communication with the ESP32
 */
export default class CommHandler {
    private static BAUD_RATE: number = 9600
    private static COMMAND_REGEX = /^([a-z_]+)(?:\s+(.*))?$/;
    private readonly serialPort: SerialPort;
    private readonly parser: ReadlineParser
    private readonly commandQueue: Array<Command> = []

    public constructor(path: string = "/dev/rfcomm0") {
        console.log(chalk.green(`Opening serial port at ${path}`))

        this.serialPort = new SerialPort({path: "/dev/rfcomm0", baudRate: CommHandler.BAUD_RATE})
        this.parser = new ReadlineParser()
        this.serialPort.pipe(this.parser)
        this.parser.on("data", this.readCommand)
        this.parser.on("error", console.error)
        this.serialPort.write("log TEST_PLAYLOAD\n")

        //this.parser.on("data", this.onSerialData)
        console.log(chalk.green("Serial port opened"))
    }

    private readCommand(data: string) {
        console.log("["+data+"]")
        const match = data.match(CommHandler.COMMAND_REGEX)
        console.log(match)
        if (match) {
            const command = match[1]
            const playload = match[2] ?? ""
            console.log(chalk.green(`Command: ${command}, Playload: ${playload}`))
        } else {
            console.error(chalk.red(`Invalid command: ${data}`))
        }
        //this.commandQueue.push()
        //this.commandQueue.shift()
    }

    public sendCommand(command: string, playload: string) {
        this.serialPort.write(`${command} ${playload}\n`)
    }

    public getSerialPort(): SerialPort {
        return this.serialPort
    }
}