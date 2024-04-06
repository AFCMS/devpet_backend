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
