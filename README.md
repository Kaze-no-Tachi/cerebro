Cerebro
------------
[![build](https://github.com/Kaze-no-Tachi/cerebro/actions/workflows/scala.yml/badge.svg?branch=main)](https://github.com/Kaze-no-Tachi/cerebro/actions/workflows/scala.yml)
[![release](https://img.shields.io/github/v/release/Kaze-no-Tachi/cerebro?sort=semver)](https://github.com/Kaze-no-Tachi/cerebro/releases)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

cerebro is an open source (MIT License) elasticsearch web admin tool built using Scala, Play Framework, AngularJS and Bootstrap.

### About this fork

This repository is a maintained fork of [lmenezes/cerebro](https://github.com/lmenezes/cerebro), which has been dormant since v0.9.4 (April 2021). The fork was started to restore compatibility with modern clusters — Elasticsearch 8.x and 9.x, and OpenSearch 1.x through 3.x — and to refresh the underlying Scala / Play / JDK stack. See [CHANGES.md](CHANGES.md) for the v0.10.0 release notes.

### Requirements

cerebro needs Java 11 or newer to run (Java 17 LTS recommended).

### Supported clusters

cerebro talks to a wide range of cluster versions over the REST API:

- Elasticsearch 6.8, 7.x, 8.x and 9.x
- OpenSearch 1.x, 2.x and 3.x

The product (Elasticsearch vs OpenSearch) and version are detected automatically from the cluster's root endpoint (`GET /`) on first connect and cached for 5 minutes.

### Connecting to TLS-secured clusters

Elasticsearch 8+ ships with TLS and Basic auth enabled by default. Point cerebro at `https://<host>:9200` and supply Basic credentials per-host in `conf/application.conf`. For self-signed or private-CA certs, either trust the cluster CA in the JVM truststore:

```
keytool -import -trustcacerts -file http_ca.crt -alias es \
  -keystore "$JAVA_HOME/lib/security/cacerts"
```

…or set `play.ws.ssl.trustManager.stores` in `conf/application.conf` (a commented example block is included in the file).

### Installation

#### Download a release

- Grab the latest `cerebro-<version>.zip` from [the Releases page](https://github.com/Kaze-no-Tachi/cerebro/releases)
- Extract the archive
- Run `bin/cerebro` (or `bin/cerebro.bat` on Windows)
- Open <http://localhost:9000>

#### Build from source

```sh
git clone https://github.com/Kaze-no-Tachi/cerebro.git
cd cerebro
sbt dist
# Produces target/universal/cerebro-<version>.zip
```

#### Run via Docker (no host JDK required)

There is no published docker image for this fork yet. The simplest way to run cerebro in a container against existing cluster fixtures is to mount a staged build into the official `eclipse-temurin` image:

```sh
sbt stage
docker run -d --name cerebro -p 9000:9000 \
  -v "$(pwd)/target/universal/stage:/app:ro" \
  -w /app \
  eclipse-temurin:17-jre \
  bin/cerebro
```

> The `lmenezes/cerebro` Docker Hub image and the `cerebro-es` Chocolatey package both ship the original v0.9.4 build and **do not include the ES 8+ / OpenSearch support added in this fork.** A dedicated docker image for `Kaze-no-Tachi/cerebro` is on the roadmap.

### Configuration

#### HTTP server address and port

You can run cerebro listening on a different host and port (defaults to `0.0.0.0:9000`):

```
bin/cerebro -Dhttp.port=1234 -Dhttp.address=127.0.0.1
```

#### LDAP config

LDAP can be configured using environment variables. If you typically run cerebro under Docker, pass a file with all the env vars. The file would look like:

```bash
# Set it to ldap to activate ldap authorization
AUTH_TYPE=ldap

# Your ldap url
LDAP_URL=ldap://example.com:389

LDAP_BASE_DN=OU=users,DC=example,DC=com

# Usually method should be "simple" otherwise, set it to the SASL mechanisms
LDAP_METHOD=simple

# user-template executes a string.format() operation where
# username is passed in first, followed by base-dn. Some examples
#  - %s => leave user untouched
#  - %s@domain.com => append "@domain.com" to username
#  - uid=%s,%s => usual case of OpenLDAP
LDAP_USER_TEMPLATE=%s@example.com

# User identifier that can perform searches
LDAP_BIND_DN=admin@example.com
LDAP_BIND_PWD=adminpass

# Group membership settings (optional)

# If left unset LDAP_BASE_DN will be used
# LDAP_GROUP_BASE_DN=OU=users,DC=example,DC=com

# Attribute that represent the user, for example uid or mail
# LDAP_USER_ATTR=mail

# If left unset LDAP_USER_TEMPLATE will be used
# LDAP_USER_ATTR_TEMPLATE=%s

# Filter that tests membership of the group. If this property is empty then there is no group membership check
# AD example => memberOf=CN=mygroup,ou=ouofthegroup,DC=domain,DC=com
# OpenLDAP example => CN=mygroup
# LDAP_GROUP=memberOf=memberOf=CN=mygroup,ou=ouofthegroup,DC=domain,DC=com
```

Pass the file to your container with `--env-file`:

```bash
docker run -p 9000:9000 --env-file env-ldap \
  -v "$(pwd)/target/universal/stage:/app:ro" \
  -w /app \
  eclipse-temurin:17-jre \
  bin/cerebro
```

There are more examples of configuration in the [examples folder](./examples).

#### Other settings

Other settings are exposed through the `conf/application.conf` file found in the application directory.

It is also possible to use an alternate configuration file defined at a different location:

```
bin/cerebro -Dconfig.file=/some/other/dir/alternate.conf
```

### Development

Run the tests:

```sh
sbt test
```

Run the integration suite against real ES + OpenSearch containers:

```sh
docker compose -f docker-compose.test.yml up -d --wait
CEREBRO_IT=1 sbt 'testOnly *IT'
```

(Convenience scripts: [`bin/it.sh`](bin/it.sh) on macOS/Linux, [`bin/it.ps1`](bin/it.ps1) on Windows.)

#### Working on the new (Vue 3) UI

The legacy AngularJS UI continues to live at `/`. A Vue 3 + Vite + PrimeVue + Pinia rewrite is being assembled at [`frontend/`](frontend/) and mounted at `/next`. The two coexist during migration; once the new SPA reaches parity it will become the default and the AngularJS bundle will be removed.

Backend API contract for both UIs: [`docs/api.md`](docs/api.md).

To work on the new UI:

```sh
# In one shell, run the Play backend
sbt run

# In another shell, run the Vite dev server
cd frontend
npm install
npm run dev
# Open http://localhost:5173/next/
```

Vite proxies API calls to the Play backend at `http://localhost:9000` (see [`frontend/vite.config.ts`](frontend/vite.config.ts)).

For a production build of the new UI:

```sh
cd frontend
npm run build
# Copy the build output into the Play app's public/ directory so it gets
# bundled by `sbt dist`:
mkdir -p ../public/dist
cp -r dist/* ../public/dist/
```

Then `sbt dist` produces the usual zip with the new SPA accessible at `/next`.

### License

MIT — see [LICENSE](LICENSE). Original copyright (c) Leonardo Menezes; modifications under the same license in this fork.
