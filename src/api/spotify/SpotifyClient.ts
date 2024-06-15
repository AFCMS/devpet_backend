/*
SPDX-FileCopyrightText: 2024 AFCMS <afcm.contact@gmail.com>
SPDX-License-Identifier: GPL-3.0-or-later
*/

import * as fs from "node:fs";
import * as querystring from "node:querystring";

import express from "express";
import chalk from "chalk";
import open from "open";
import {AccessToken, SpotifyApi} from "@spotify/web-api-ts-sdk";

export default class SpotifyClient {
    /**
     * The instance of the SpotifyClient, used to prevent creating multiple instances
     * @private
     */
    private static instance: SpotifyClient | null = null;

    /**
     * The file name to save the state to
     * @private
     */
    private static readonly FILE_NAME_STATE = "spotify-state.json";

    /**
     * The local server port to use for the OAuth2 flow
     * @private
     */
    private static readonly LOCAL_SERVER_PORT = 9600;

    private readonly clientId: string;
    private readonly clientSecret: string;

    private refreshToken: string | null = null;
    private token: AccessToken | null = null;

    /**
     * The SDK instance
     * @private
     */
    private sdk: SpotifyApi | null = null;

    /**
     * Create a new instance of the SpotifyClient
     * @param clientId The client ID
     * @param clientSecret The client secret
     * @private
     */
    private constructor(clientId: string, clientSecret: string) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;

        this.loadState();
        this.doRefreshClient();
    }

    /**
     * Get the SpotifyClient instance, prevent creating multiple instances of the state
     */
    public static getInstance(clientId?: string, clientSecret?: string): SpotifyClient {
        if (!SpotifyClient.instance) {
            if (!clientId || !clientSecret) {
                throw new Error("No client ID or client secret provided and no instance available")
            }
            SpotifyClient.instance = new SpotifyClient(clientId, clientSecret);
        }
        return SpotifyClient.instance;
    }

    /**
     * Spotify OAuth2 flow to get the refresh token
     */
    public async refreshTokenFlow(openBrowser: boolean = true) {
        const app = express();

        app.get("/spotify/success", (_, res) => {
            res.send("Success");
            setTimeout(function () {
                server.close();
                console.log(chalk.green("Login completed"))
            }, 2000)
        });

        app.get("/spotify/login", async (_, res) => {
            const state = "somestate12345";

            res.redirect(`https://accounts.spotify.com/authorize?` + querystring.stringify({
                response_type: "code",
                client_id: this.clientId,
                scope: "user-read-currently-playing",
                redirect_uri: `http://localhost:${SpotifyClient.LOCAL_SERVER_PORT}/spotify/callback`,
                state: state
            }));
        });

        app.get("/spotify/callback", async (req, res) => {
            const code = req.query.code || null;
            const state = req.query.state || null;

            if (state === null) {
                res.redirect("/#" +
                    querystring.stringify({
                        error: 'state_mismatch'
                    }));
            } else {
                const body = new FormData();
                body.set("code", code as string);
                body.set("redirect_uri", `http://localhost:${SpotifyClient.LOCAL_SERVER_PORT}/spotify/callback`);
                body.set("grant_type", "authorization_code");

                const data = await fetch("https://accounts.spotify.com/api/token", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: querystring.stringify({
                        code: code as string,
                        redirect_uri: `http://localhost:${SpotifyClient.LOCAL_SERVER_PORT}/spotify/callback`,
                        grant_type: "authorization_code",
                        client_id: this.clientId,
                        client_secret: this.clientSecret,
                    })
                })

                // Extract the token from the body
                const token = await data.json();

                this.refreshToken = token.refresh_token;
                this.token = token.access_token;
                this.token = token

                this.saveState();

                res.redirect("/spotify/success");

                await this.doRefreshToken();
            }
        });

        console.log(chalk.green("Starting OAuth2 flow for Spotify client"))
        if (openBrowser) {
            console.log(chalk.green("Opening browser..."))
            await open(`http://localhost:${SpotifyClient.LOCAL_SERVER_PORT}/spotify/login`);
        } else {
            console.log(chalk.green(`Open your browser at http://localhost:${SpotifyClient.LOCAL_SERVER_PORT}/spotify/login`))
        }
        const server = app.listen(9600)
    }

    public async getPlayingTrack() {
        if (!this.sdk) {
            throw new Error("SDK not available")
        }

        return this.sdk.player.getCurrentlyPlayingTrack();
    }

    /**
     * Refresh the token using the refresh token
     */
    public async doRefreshToken() {
        if (!this.refreshToken) {
            throw new Error("No refresh token available")
        }

        const payload = {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": "Basic " + (Buffer.from(this.clientId + ":" + this.clientSecret).toString("base64"))
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: this.refreshToken,
                client_id: this.clientId
            }),
        }
        const body = await fetch("https://accounts.spotify.com/api/token", payload);

        if (!body.ok) {
            throw new Error("Failed to refresh token")
        }

        this.token = await body.json();
        this.saveState();
    }

    private doRefreshClient() {
        if (!this.token || !this.refreshToken) {
            return false
        }

        this.sdk = SpotifyApi.withAccessToken(this.clientId, {
            ...this.token,
            // @ts-ignore
            refresh_token: this.refreshToken,
        });

        return true;
    }

    /**
     * Save the current state to a file
     * @private
     */
    private saveState() {
        const data = {
            refreshToken: this.refreshToken,
            token: this.token
        }
        fs.writeFileSync(SpotifyClient.FILE_NAME_STATE, JSON.stringify(data, null, 2));
    }

    /**
     * Load the state from a file
     * @private
     */
    private loadState() {
        if (fs.existsSync(SpotifyClient.FILE_NAME_STATE)) {
            const data = JSON.parse(fs.readFileSync(SpotifyClient.FILE_NAME_STATE, "utf-8"));

            if (data.refreshToken) {
                this.refreshToken = data.refreshToken;
            }

            if (data.token) {
                this.token = data.token;
            }
        }
    }
}