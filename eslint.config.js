// SPDX-FileCopyrightText: 2024 AFCMS <afcm.contact@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


// noinspection JSUnusedGlobalSymbols
export default [
    {
        languageOptions: {globals: globals.node},
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_"
                }
            ]
        }
    },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
];