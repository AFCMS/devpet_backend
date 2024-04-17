// SPDX-FileCopyrightText: 2024 AFCMS <afcm.contact@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

export {};

declare global {
    namespace NodeJS {
        // noinspection JSUnusedGlobalSymbols
        interface ProcessEnv {
            /**
             * GitHub token to access the GitHub API
             *
             * Must have the `read:user` scope, overwise private profile data will not be accessible
             */
            GITHUB_TOKEN: string;
        }
    }
}
