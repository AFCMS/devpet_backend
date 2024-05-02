// SPDX-FileCopyrightText: 2024 AFCMS <afcm.contact@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import * as fs from "node:fs";

class ConfigManager {
    private static CONFIG_FILE: string = "config.json"
    public readonly GITHUB_TOKEN: string
    public readonly SERIAL_PORT: string

    constructor() {
        const data = fs.readFileSync(ConfigManager.CONFIG_FILE)
        
        const config = JSON.parse(data.toString())

        if (config["github_token"]) {
            this.GITHUB_TOKEN = config["github_token"]
        } else {
            throw new Error("No github_token found in config file")
        }

        if (config["serial_port"]) {
            this.SERIAL_PORT = config["serial_port"]
        } else {
            throw new Error("No serial_port found in config file")
        }
    }
}

export default ConfigManager;