<!--
SPDX-FileCopyrightText: 2024 AFCMS <afcm.contact@gmail.com>
SPDX-License-Identifier: GPL-3.0-or-later
-->

# DevPet Backend

[![NodeJS](https://github.com/AFCMS/devpet_backend/actions/workflows/nodejs.yml/badge.svg)](https://github.com/AFCMS/devpet_backend/actions/workflows/nodejs.yml)

## Run the project

### Install NodeJS

The required version of [NodeJS](https://nodejs.org) is LTS/Iron (v20) with the [PNPM](https://pnpm.io) package manager.

You can use [NVM](https://github.com/nvm-sh/nvm) to install it.

### Install dependencies

```bash
pnpm install --include=dev
```

### Connect the ESP32 serial port (Linux instructions)

Now we need to connect the DevPet Bluetooth as a serial port to the computer.

You can pair the ESP32 using the normal bluetooth pairing flow.

Using the `rfcomm` you can connect the device to the `/dev/rfcomm0` port.

Install `rfcomm` under Fedora:

```shell
sudo dnf install bluez-deprecated
```

```shell
sudo rfcomm connect /dev/rfcomm0 <DEVICE ADDRESS> 1
```

> [!NOTE]
>
> The `rfcomm` utility is deprecated and doesn't have a clear replacement.
>
> Ideally there should be a driver automatically connecting the device as a serial device using BlueZ DBus API

### Setup environment variables

You can copy the `.env.example` file and fill out the values with the following instructions

#### Serial Port

Set `DEVPET_SERIAL_PORT` to the serial port where the ESP32 is connected, typically the `/dev/rfcomm0` if you used
rfcomm as above.

#### GitHub

Go to your GitHub user account settings in the developper tab, create a
new [personal access token](https://github.com/settings/tokens) with the `read:user` and `repo` scopes.

Set `DEVPET_GITHUB_TOKEN` to the given token.

#### Spotify

Spotify doens't have PATs, so we have to rely on a OAuth2 application (APIs from litteraly all music providers are
ridiculeously bad).

First you need to create a new OAuth2 app on
the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), set the redirect URL
to `http://localhost:9600/spotify/callback`.

Set `DEVPET_SPOTIFY_CLIENT_ID` and `DEVPET_SPOTIFY_CLIENT_SECRET` to the given values.

Then you can login to your own OAuth2 app by running the following command and clicking the displayed link:

```shell
pnpm start spotify-login
```

### Start the backend

```shell
pnpm start run
```
